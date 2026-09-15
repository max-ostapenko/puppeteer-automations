const { notifyOffers } = require('./notifier');
const fs = require('fs');
const path = require('path');

const LOCATIONS_API =
  'https://crowd-api-production-615013621295.europe-west1.run.app/v1/locations/offers?locale=en';
const OFFERS_API =
  'https://crowd-api-production-615013621295.europe-west1.run.app/v1/offers?locale=en';

class MovacarScraper {
  constructor(options = {}) {
    this.currentDirectory = path.dirname(__filename);
    this.tripsJSONfile = path.join(this.currentDirectory, 'destinations.json');
    this.seenOffersFile = path.join(this.currentDirectory, 'seen_offers.json');
    this.configFile = path.join(this.currentDirectory, 'config.json');
    this.htmlFile = path.join(this.currentDirectory, 'index.html');

    this.locationsApi = options.locationsApi || LOCATIONS_API;
    this.offersApi = options.offersApi || OFFERS_API;
    this.config = this._loadConfig();
  }

  _loadConfig() {
    if (fs.existsSync(this.configFile)) {
      try {
        const raw = fs.readFileSync(this.configFile, 'utf8');
        return JSON.parse(raw);
      } catch (err) {
        console.warn('Could not parse config.json, falling back to empty defaults:', err.message);
      }
    }

    return {
      rules: [],
      checkIntervalHours: 12,
      notifyOnAllMatches: false,
    };
  }

  _loadSeenOffers() {
    if (fs.existsSync(this.seenOffersFile)) {
      try {
        const raw = fs.readFileSync(this.seenOffersFile, 'utf8');
        const data = JSON.parse(raw);
        return new Set(Array.isArray(data) ? data : Object.keys(data));
      } catch (err) {
        console.warn('Could not parse seen_offers.json, starting fresh:', err.message);
      }
    }
    return new Set();
  }

  _saveSeenOffers(seenSet) {
    try {
      const arr = Array.from(seenSet);
      // Keep last 500 seen IDs to avoid indefinite file growth
      const trimmed = arr.slice(-500);
      fs.writeFileSync(this.seenOffersFile, JSON.stringify(trimmed, null, 2));
    } catch (err) {
      console.error('Failed to save seen_offers.json:', err.message);
    }
  }

  /**
   * Discover active origins and build city lookup table directly from Movacar backend.
   * Completely eliminates sitemap downloads, Cloudflare blocks, and headless browser dependencies.
   */
  async _discoverLocations() {
    console.log(`Discovering active location hubs from ${this.locationsApi}...`);
    const res = await fetch(this.locationsApi, {
      headers: {
        Accept: 'application/json',
      },
    });

    if (!res.ok) {
      throw new Error(`Locations discovery failed with HTTP status ${res.status}`);
    }

    const json = await res.json();
    const items = json.included || [];

    const cityMap = new Map();
    const originMap = new Map();

    const aliases = {
      rome: 'roma',
      venice: 'venezia',
      gothenburg: 'göteborg',
      antwerp: 'antwerpen',
      staffanstorp: 'staffanstorps kommun',
    };

    for (const item of items) {
      const attr = item.attributes;
      if (!attr || !attr.name || !attr.reference) continue;

      const name = attr.name;
      const ref = attr.reference;
      const lower = name.toLowerCase().trim();

      cityMap.set(lower, ref);

      // Clean out parenthetical descriptors: e.g. "Viladecans (near Barcelona)" -> "Viladecans"
      const stripped = lower.replace(/\s*\((?:near|bei)\s+[^)]+\)/i, '').trim();
      if (stripped && !cityMap.has(stripped)) {
        cityMap.set(stripped, ref);
      }

      // Index parenthetical hub name: e.g. "near Oslo Airport" -> "Oslo"
      const parenthetical = lower.match(/\((?:near|bei)\s+([^)]+)\)/i);
      if (parenthetical) {
        const hub = parenthetical[1].replace(/airport/i, '').trim();
        if (hub && !cityMap.has(hub)) {
          cityMap.set(hub, ref);
        }
      }

      // Filter and register active origins with available inventory
      if (attr.location_type === 'origin' && attr.offer_count > 0) {
        if (
          this.config.preferredOrigins &&
          this.config.preferredOrigins.length > 0 &&
          !this.config.preferredOrigins.some((pref) => pref.toLowerCase() === name.toLowerCase())
        ) {
          continue;
        }

        originMap.set(name, {
          origin: name,
          oid: ref,
          offerCount: attr.offer_count,
        });
      }
    }

    const cityResolver = {
      lookup: (name) => {
        if (!name) return null;
        const lower = name.toLowerCase().trim();
        if (cityMap.has(lower)) return { id: cityMap.get(lower), queryName: name };

        const stripped = lower.replace(/\s*\((?:near|bei)\s+[^)]+\)/i, '').trim();
        if (cityMap.has(stripped)) {
          return {
            id: cityMap.get(stripped),
            queryName: name.replace(/\s*\((?:near|bei)\s+[^)]+\)/i, '').trim(),
          };
        }

        const parenthetical = lower.match(/\((?:near|bei)\s+([^)]+)\)/i);
        if (parenthetical) {
          const hub = parenthetical[1].replace(/airport/i, '').trim();
          if (cityMap.has(hub)) return { id: cityMap.get(hub), queryName: hub };
        }

        if (aliases[lower] && cityMap.has(aliases[lower])) {
          return { id: cityMap.get(aliases[lower]), queryName: aliases[lower] };
        }

        return null;
      },
    };

    console.log(
      `Discovered ${originMap.size} active origin(s) with offers: ${Array.from(originMap.keys()).join(', ')}`
    );
    return { originMap, cityResolver };
  }

  /**
   * Fetch structured offer data for a single origin directly from Movacar backend API.
   * Generates exact numeric offer IDs and station IDs for direct checkout deep-linking:
   *   https://www.movacar.com/checkout/{offer_id}?origin={origStationId}&destination={destStationId}
   */
  async _fetchOffersForOrigin(originName, oid, cityResolver) {
    const url = `${this.offersApi}&origin=${oid}`;
    try {
      const resp = await fetch(url, {
        headers: { Accept: 'application/json' },
      });

      if (!resp.ok) {
        console.warn(`Failed to fetch offers for ${originName}: HTTP ${resp.status}`);
        return [];
      }

      const json = await resp.json();
      if (!json.data || !Array.isArray(json.data)) return [];

      const stations = new Map();
      if (json.included) {
        json.included.forEach((inc) => {
          if (inc.type === 'station') {
            stations.set(inc.id, inc.attributes);
          }
        });
      }

      return json.data.map((item) => {
        const origStationId = item.relationships?.origin?.data?.id;
        const destStationId = item.relationships?.destination?.data?.id;
        const origStation = stations.get(origStationId);
        const destStation = stations.get(destStationId);
        const offerId = item.attributes?.offer_id;

        const origin = origStation?.city || origStation?.name || originName;
        const destination = destStation?.city || destStation?.name || 'Unknown';

        // Brand & provider extraction
        const brandImg = item.attributes?.brand_image_url || '';
        const filename = brandImg.split('/').pop().replace(/\.[^.]+$/, '');
        const provider =
          filename.replace(/Logo|_logo|-logo/i, '') || item.attributes?.brand_name || 'Movacar';

        // Vehicle specifications
        const modelStr = `${item.attributes?.make || ''} ${item.attributes?.model || ''}`.trim();
        const title =
          item.attributes?.vehicle_category_name ||
          (modelStr ? modelStr : 'Rental Vehicle');

        // Dates formatting (DD/MM/YY)
        const startDate = item.attributes?.start_date ? new Date(item.attributes.start_date) : null;
        const endDate = item.attributes?.end_date ? new Date(item.attributes.end_date) : null;
        const formatDate = (d) => {
          if (!d || isNaN(d.getTime())) return '';
          const day = String(d.getUTCDate()).padStart(2, '0');
          const month = String(d.getUTCMonth() + 1).padStart(2, '0');
          const year = String(d.getUTCFullYear()).slice(-2);
          return `${day}/${month}/${year}`;
        };
        const earliestPickup = formatDate(startDate);
        const latestDelivery = formatDate(endDate);

        // Durations
        // In Movacar's API:
        // `period` is the included rental duration in hours (e.g. 192h = 8 days included).
        // `extra_period` is the total maximum allowed rental duration in hours (e.g. 288h = 12 days max).
        // Extra days available is therefore (extra_period - period) / 24, NOT extra_period / 24.
        const periodHours = item.attributes?.period || 24;
        const extraPeriodHours = item.attributes?.extra_period || 0;
        const includedDaysNum = Math.max(1, Math.round(periodHours / 24));
        const extraDaysNum =
          extraPeriodHours > periodHours
            ? Math.round((extraPeriodHours - periodHours) / 24)
            : 0;
        const totalDays = includedDaysNum + extraDaysNum;
        const includedDays = `${includedDaysNum} day${includedDaysNum > 1 ? 's' : ''} incl.`;
        const extraDays =
          extraDaysNum > 0 ? `+ ${extraDaysNum} day${extraDaysNum > 1 ? 's' : ''} extra` : '';

        // Distance & Pace
        const distMeters = item.attributes?.distance || 0;
        const freeKm = item.attributes?.free_km || Math.round(distMeters / 1000);
        const distanceKm = freeKm;
        const distance = `${distanceKm}km`;
        const dailyKmIncluded =
          distanceKm && includedDaysNum ? Math.round(distanceKm / includedDaysNum) : 0;

        // Pricing
        let priceEur = 1.0;
        const priceId = item.relationships?.base_price?.data?.id || '';
        const priceMatch = priceId.match(/(\d+)-EUR/);
        if (priceMatch) {
          priceEur = parseFloat(priceMatch[1]) / 100;
        }
        const price = `€${priceEur}`;

        // Feature chips
        const chips = [];
        if (item.attributes?.min_drivers_age) {
          chips.push(`Age ${item.attributes.min_drivers_age}+`);
        }
        if (item.attributes?.min_licence_age) {
          const years = Math.max(1, Math.round(item.attributes.min_licence_age / 12));
          chips.push(`Driving licence min. ${years} year${years > 1 ? 's' : ''}`);
        }
        if (item.attributes?.gear_type === 'crowd_vehicle_gear_type_2') {
          chips.push('Automatic');
        } else if (item.attributes?.gear_type === 'crowd_vehicle_gear_type_0') {
          chips.push('Manual');
        }

        // Exact offer checkout URL (opens offer directly)
        const checkoutUrl =
          offerId && origStationId && destStationId
            ? `https://www.movacar.com/checkout/${offerId}?origin=${origStationId}&destination=${destStationId}`
            : null;

        // Google Maps driving route template
        const mapsUrl = `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(
          origin
        )}&destination=${encodeURIComponent(destination)}&travelmode=driving`;

        // Direct origin & destination route overview link
        const origLookup = cityResolver ? cityResolver.lookup(origin) : null;
        const destLookup = cityResolver ? cityResolver.lookup(destination) : null;
        let routeUrl = `https://www.movacar.com/offers?origin=${encodeURIComponent(origin)}`;
        if (origLookup && destLookup) {
          routeUrl = `https://www.movacar.com/en-US/offers?origin=${encodeURIComponent(
            origLookup.queryName
          )}&oid=${origLookup.id}&destination=${encodeURIComponent(
            destLookup.queryName
          )}&did=${destLookup.id}`;
        }

        const id = `${origin}_${destination}_${title}_${earliestPickup}_${latestDelivery}_${priceEur}_${totalDays}`.replace(
          /\s+/g,
          '_'
        );

        return {
          id,
          offerId,
          origin,
          destination,
          originStationId: origStationId,
          destStationId: destStationId,
          title,
          provider,
          earliestPickup,
          latestDelivery,
          includedDays,
          extraDays,
          includedDaysNum,
          extraDaysNum,
          totalDays,
          distance,
          distanceKm,
          dailyKmIncluded,
          fuel: item.attributes?.fuel_type || '',
          chips,
          price,
          priceEur,
          checkoutUrl,
          url: checkoutUrl || routeUrl,
          routeUrl,
          mapsUrl,
        };
      });
    } catch (err) {
      console.error(`Error fetching offers for ${originName}:`, err.message);
      return [];
    }
  }

  async _fetchAllOffers(originMap, cityResolver) {
    const queue = Array.from(originMap.values());
    const results = [];
    const concurrency = 8;

    console.log(`Extracting offers for ${queue.length} origin(s) with concurrency ${concurrency}...`);

    const worker = async () => {
      while (queue.length > 0) {
        const item = queue.shift();
        if (!item) break;
        const { origin, oid } = item;
        const offers = await this._fetchOffersForOrigin(origin, oid, cityResolver);
        if (offers.length > 0) {
          console.log(`  → Found ${offers.length} offer(s) departing from ${origin}`);
          results.push(...offers);
        }
      }
    };

    await Promise.all(Array.from({ length: concurrency }, () => worker()));
    return results;
  }

  _matchRule(offer, rule, allRules = [], visited = new Set()) {
    // 0. Exclude rules check (e.g. for "everything excluding the current two")
    if (rule.excludeRuleIds && rule.excludeRuleIds.length > 0) {
      if (visited.has(rule.id)) return false;
      visited.add(rule.id);

      const isExcludedByRule = rule.excludeRuleIds.some((excludedId) => {
        const targetRule = allRules.find((r) => r.id === excludedId);
        return targetRule && this._matchRule(offer, targetRule, allRules, new Set(visited));
      });
      if (isExcludedByRule) return false;
    }

    // Exclude specific locations check
    if (rule.excludeFromOrTo && rule.excludeFromOrTo.length > 0) {
      const matchExcludedLoc = rule.excludeFromOrTo.some(
        (loc) =>
          offer.origin.toLowerCase().includes(loc.toLowerCase()) ||
          offer.destination.toLowerCase().includes(loc.toLowerCase())
      );
      if (matchExcludedLoc) return false;
    }

    // 1. Max price filter
    if (rule.maxPrice !== null && rule.maxPrice !== undefined) {
      if (offer.priceEur > rule.maxPrice) {
        return false;
      }
    }

    // 2. Minimum duration filters
    if (rule.minIncludedDays !== null && rule.minIncludedDays !== undefined) {
      const inc =
        offer.includedDaysNum !== undefined
          ? offer.includedDaysNum
          : offer.includedDays
          ? parseInt(offer.includedDays, 10) || 0
          : 0;
      if (inc < rule.minIncludedDays) {
        return false;
      }
    }

    if (rule.minTotalDays !== null && rule.minTotalDays !== undefined) {
      const tot =
        offer.totalDays !== undefined
          ? offer.totalDays
          : (offer.includedDaysNum || 0) + (offer.extraDaysNum || 0);
      if (tot < rule.minTotalDays) {
        return false;
      }
    }

    // 3. fromOrTo check (matches either origin OR destination)
    if (rule.fromOrTo && rule.fromOrTo.length > 0) {
      const matchFromOrTo = rule.fromOrTo.some(
        (loc) =>
          offer.origin.toLowerCase().includes(loc.toLowerCase()) ||
          offer.destination.toLowerCase().includes(loc.toLowerCase())
      );
      if (!matchFromOrTo) return false;
    }

    // 4. Distance filter (e.g. minimum km)
    if (rule.minDistanceKm !== null && rule.minDistanceKm !== undefined) {
      const km =
        offer.distanceKm !== undefined
          ? offer.distanceKm
          : (offer.distance || '').replace(/,/g, '').match(/(\d+)/)
          ? parseInt((offer.distance || '').replace(/,/g, '').match(/(\d+)/)[1], 10)
          : 0;
      if (km < rule.minDistanceKm) {
        return false;
      }
    }

    // 5. between check (Origin in groupA and Destination in groupB, or vice-versa)
    if (rule.between) {
      const { groupA, groupB } = rule.between;
      if (groupA && groupB && groupA.length > 0 && groupB.length > 0) {
        const originInA = groupA.some((loc) =>
          offer.origin.toLowerCase().includes(loc.toLowerCase())
        );
        const destInB = groupB.some((loc) =>
          offer.destination.toLowerCase().includes(loc.toLowerCase())
        );
        const originInB = groupB.some((loc) =>
          offer.origin.toLowerCase().includes(loc.toLowerCase())
        );
        const destInA = groupA.some((loc) =>
          offer.destination.toLowerCase().includes(loc.toLowerCase())
        );

        const aToB = originInA && destInB;
        const bToA = originInB && destInA;

        if (!aToB && !bToA) {
          return false;
        }
      }
    }

    // 6. Blacklisted vehicles filter
    if (rule.blacklistedVehicles && rule.blacklistedVehicles.length > 0) {
      const vehicleText = `${offer.title} ${offer.provider}`.toLowerCase();
      const isBlacklisted = rule.blacklistedVehicles.some((b) =>
        vehicleText.includes(b.toLowerCase())
      );
      if (isBlacklisted) {
        return false;
      }
    }

    return true;
  }

  _matchesFilter(offer) {
    if (this.config.rules && this.config.rules.length > 0) {
      return this.config.rules.some((rule) =>
        this._matchRule(offer, rule, this.config.rules)
      );
    }

    // Fallback if no rules defined
    if (this.config.maxPrice !== null && this.config.maxPrice !== undefined) {
      if (offer.priceEur > this.config.maxPrice) {
        return false;
      }
    }

    if (this.config.minIncludedDays !== null && this.config.minIncludedDays !== undefined) {
      const inc =
        offer.includedDaysNum !== undefined
          ? offer.includedDaysNum
          : offer.includedDays
          ? parseInt(offer.includedDays, 10) || 0
          : 0;
      if (inc < this.config.minIncludedDays) {
        return false;
      }
    }

    if (this.config.minTotalDays !== null && this.config.minTotalDays !== undefined) {
      const tot =
        offer.totalDays !== undefined
          ? offer.totalDays
          : (offer.includedDaysNum || 0) + (offer.extraDaysNum || 0);
      if (tot < this.config.minTotalDays) {
        return false;
      }
    }

    return true;
  }

  _sortOffers(offers) {
    return offers.sort((a, b) => {
      const incA =
        a.includedDaysNum !== undefined
          ? a.includedDaysNum
          : a.includedDays
          ? parseInt(a.includedDays, 10) || 0
          : 0;
      const incB =
        b.includedDaysNum !== undefined
          ? b.includedDaysNum
          : b.includedDays
          ? parseInt(b.includedDays, 10) || 0
          : 0;
      if (incB !== incA) {
        return incB - incA; // 1. Highest included days first
      }

      const totA =
        a.totalDays !== undefined ? a.totalDays : incA + (a.extraDaysNum || 0);
      const totB =
        b.totalDays !== undefined ? b.totalDays : incB + (b.extraDaysNum || 0);
      if (totB !== totA) {
        return totB - totA; // 2. Total days next
      }

      const priceA = a.priceEur !== undefined ? a.priceEur : 9999;
      const priceB = b.priceEur !== undefined ? b.priceEur : 9999;
      return priceA - priceB; // 3. Lowest price
    });
  }

  /**
   * Save structured output to canonical destinations.json and destinations.js for zero-CORS local file:/// viewing.
   */
  _writeToFile(destinations) {
    // 1. Write canonical destinations.json file
    fs.writeFileSync(this.tripsJSONfile, JSON.stringify(destinations, null, 2));
    console.log(`Saved trips data to ${this.tripsJSONfile}`);

    // 2. Write destinations.js to enable instantaneous, CORS-free local browser viewing over file:///
    const jsFile = path.join(this.currentDirectory, 'destinations.js');
    fs.writeFileSync(jsFile, `window.movacarData = ${JSON.stringify(destinations)};\n`);
    console.log(`Saved trips script to ${jsFile}`);

    // 3. Clean any legacy embedded <script id="movacar-data"> from index.html if present
    if (fs.existsSync(this.htmlFile)) {
      try {
        let html = fs.readFileSync(this.htmlFile, 'utf8');
        const tagRegex = /<script id="movacar-data" type="application\/json">[\s\S]*?<\/script>\s*/;
        if (tagRegex.test(html)) {
          html = html.replace(tagRegex, '');
          fs.writeFileSync(this.htmlFile, html);
          console.log(`Stripped legacy embedded script data from ${this.htmlFile}`);
        }
      } catch (err) {
        console.warn('Could not inspect index.html:', err.message);
      }
    }
  }

  async run() {
    const startTime = Date.now();
    console.log(`\n=== Starting Movacar Direct Backend Scraper at ${new Date().toISOString()} ===`);
    console.log('Active matching rules:', (this.config.rules || []).map((r) => r.label || r.id).join(', '));

    const allOffers = [];
    const seenOffers = this._loadSeenOffers();
    const newMatchingOffers = [];

    try {
      // 1. Instant discovery of active location hubs & city resolver table
      const { originMap, cityResolver } = await this._discoverLocations();

      // 2. High-speed concurrent offer extraction directly from Cloud Run API
      const scrapedOffers = await this._fetchAllOffers(originMap, cityResolver);

      for (const offer of scrapedOffers) {
        // Evaluate rules matching
        const matchedRuleLabels = [];
        for (const rule of this.config.rules || []) {
          if (this._matchRule(offer, rule, this.config.rules)) {
            matchedRuleLabels.push(rule.label || rule.id);
          }
        }
        offer.matchedRules = matchedRuleLabels;

        allOffers.push(offer);

        const matches = this._matchesFilter(offer);
        const isNew = !seenOffers.has(offer.id);

        if (matches) {
          if (isNew || this.config.notifyOnAllMatches) {
            newMatchingOffers.push(offer);
          }
        }

        seenOffers.add(offer.id);
      }

      console.log(`\nScraped a total of ${allOffers.length} available offer(s).`);

      // Sort offers by priority
      this._sortOffers(allOffers);
      this._sortOffers(newMatchingOffers);

      // Group offers by rule profile
      const matchesByRule = {};
      for (const rule of this.config.rules || []) {
        const label = rule.label || rule.id;
        const matched = allOffers.filter((o) =>
          this._matchRule(o, rule, this.config.rules)
        );
        this._sortOffers(matched);
        matchesByRule[label] = matched;
      }

      // 3. Save single canonical JSON file and update index.html
      const destinations = {
        parsedDate: new Date().toISOString(),
        totalScraped: allOffers.length,
        matchesByRule,
        offers: allOffers,
      };
      this._writeToFile(destinations);

      // 4. Save seen offers
      this._saveSeenOffers(seenOffers);

      // 5. Dispatch notifications for new matching offers
      if (newMatchingOffers.length > 0) {
        await notifyOffers(newMatchingOffers);
      } else {
        console.log('No new matching deals to alert at this time.');
      }

      const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
      console.log(`=== Movacar Run Completed Successfully in ${elapsed}s ===\n`);
    } catch (err) {
      console.error('Fatal error during Movacar scraping run:', err);
    }
  }
}

if (require.main === module) {
  const scraper = new MovacarScraper();
  scraper.run();
}

module.exports = { MovacarScraper };
