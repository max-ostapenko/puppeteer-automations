function testAdobeRequest(url) {
    let array = url.split('&');
    let object = {};
    object.reportsuite = array[0].substring(40).replace(/\/.*/, '');
    array.forEach(
        item => object[item.split('=')[0]] = item.split('=')[1]
    )

    if(object.v16 != 'aem') {
        //console.log(object.v26);
        console.log(" v26:" + object.v26 + " v27:" + object.v27);
    }
};