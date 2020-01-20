export default class DetailsViewController {
    formatDetailsArray (exifImage) {
        return [
            ['Time and Date', [
                ['Date Time Original', exifImage.getDateTimeOriginal()],
                ['Date Time', exifImage.getDateTime()],
                ['Date Time Digitized', exifImage.getDateTimeDigitized()],
            ]],
            ['GPS', [
                ['Latitude', exifImage.getLatitude()],
                ['Longitude', exifImage.getLongitude()]
            ]]
        ]
    }
}