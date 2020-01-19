export default class DetailsViewController {

    // const detailsArray = [
        // ['Time and Date', [
        //     ['Time Taken', '1pm'],
        //     ['Date Taken', '1/1/2020'],
        //     ['Month Taken', 'January'],
        //     ['Year Taken', '2020']
        // ]],
        // ['GPS', [
        //     ['Latitude', '1000.001'],
        //     ['Longitude', '-30.001'],
        //     ['Altitude', '10 feet']
        // ]],
    // ]

    formatDetailsArray (exifImage) {
        return [
            ['Time and Date', [
                ['Timestamp', exifImage.dateTimeOriginal]
            ]],
            ['GPS', [
                ['Latitude', exifImage.gps.position.latitude],
                ['Longitude', exifImage.gps.position.longitude]
            ]]
        ]
    }
}