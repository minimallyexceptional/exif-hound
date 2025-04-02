import React, { useState } from 'react';
import { ImageData } from '../types';
import { Camera, Clock, MapPin, Images, FileText, Image as ImageIcon } from 'lucide-react';
import ImageComparison from './ImageComparison';
import FullExifView from './FullExifView';
import ExifReader from 'exifreader';

interface Props {
  image: ImageData;
}

const ExifPanel: React.FC<Props> = ({ image }) => {
  const { exif } = image;
  const [showComparison, setShowComparison] = useState(false);
  const [showFullExif, setShowFullExif] = useState(false);
  const [rawExif, setRawExif] = useState<any>(null);

  const hasValidCoordinates = 
    typeof exif.latitude === 'number' && 
    typeof exif.longitude === 'number' && 
    !isNaN(exif.latitude) && 
    !isNaN(exif.longitude);

  const formatCoordinates = () => {
    if (!hasValidCoordinates || exif.latitude == null || exif.longitude == null) {
      return 'No location data available';
    }
    return `${exif.latitude.toFixed(6)}, ${exif.longitude.toFixed(6)}`;
  };

  const handleViewFullExif = async () => {
    if (!rawExif) {
      try {
        const tags = await ExifReader.load(image.file, { expanded: true });
        console.log('Full EXIF tags:', tags);
        setRawExif(tags);
      } catch (error) {
        console.error('Error loading full EXIF data:', error);
        setRawExif({});
      }
    }
    setShowFullExif(true);
  };

  if (showFullExif && rawExif) {
    return (
      <FullExifView
        image={image}
        rawExif={rawExif}
        onClose={() => setShowFullExif(false)}
      />
    );
  }

  return (
    <>
      <div className="glass-panel rounded-lg overflow-hidden h-full flex flex-col">
        <div className="flex-none p-4 border-b border-app-gray-light/30">
          <h2 className="text-lg font-semibold text-app-white">Image Details</h2>
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="p-4 border-b border-app-gray-light/30">
            <div className="flex gap-4">
              <div className="flex-none w-32 h-32">
                <div className="relative w-full h-full rounded-lg overflow-hidden border border-app-gray-light/30">
                  <img 
                    src={image.url} 
                    alt="Selected" 
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-app-white flex items-center gap-2 mb-2">
                  <ImageIcon className="w-4 h-4 text-app-accent" />
                  <span className="truncate">{image.file.name}</span>
                </h3>
                <div className="space-y-2">
                  <button
                    onClick={() => setShowComparison(true)}
                    className="w-full button-secondary flex items-center justify-center space-x-2 py-1.5"
                  >
                    <Images className="w-4 h-4" />
                    <span>Compare with EXIF Thumbnail</span>
                  </button>
                  <button
                    onClick={handleViewFullExif}
                    className="w-full button-secondary flex items-center justify-center space-x-2 py-1.5"
                  >
                    <FileText className="w-4 h-4" />
                    <span>View All EXIF Data</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
          
          <div className="p-4 space-y-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-app-white">
                <MapPin className="w-5 h-5 text-app-accent" />
                <h3 className="font-medium">Location</h3>
              </div>
              <p className={`pl-7 ${hasValidCoordinates ? 'text-app-accent' : 'text-app-accent-dim'}`}>
                {formatCoordinates()}
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-app-white">
                <Clock className="w-5 h-5 text-app-accent" />
                <h3 className="font-medium">Date Taken</h3>
              </div>
              <p className="text-app-accent pl-7">
                {exif.dateTimeOriginal || 'Not available'}
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-app-white">
                <Camera className="w-5 h-5 text-app-accent" />
                <h3 className="font-medium">Camera Details</h3>
              </div>
              <div className="pl-7">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="space-y-3">
                    <div>
                      <div className="text-app-accent-dim mb-1">Make</div>
                      <div className="text-app-accent font-medium">{exif.make || 'N/A'}</div>
                    </div>
                    <div>
                      <div className="text-app-accent-dim mb-1">Model</div>
                      <div className="text-app-accent font-medium">{exif.model || 'N/A'}</div>
                    </div>
                    <div>
                      <div className="text-app-accent-dim mb-1">Exposure Time</div>
                      <div className="text-app-accent font-medium">{exif.exposureTime || 'N/A'}</div>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <div className="text-app-accent-dim mb-1">F-Number</div>
                      <div className="text-app-accent font-medium">{exif.fNumber || 'N/A'}</div>
                    </div>
                    <div>
                      <div className="text-app-accent-dim mb-1">ISO</div>
                      <div className="text-app-accent font-medium">{exif.iso || 'N/A'}</div>
                    </div>
                    <div>
                      <div className="text-app-accent-dim mb-1">Focal Length</div>
                      <div className="text-app-accent font-medium">
                        {exif.focalLength ? `${exif.focalLength}mm` : 'N/A'}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-app-white">
                <FileText className="w-5 h-5 text-app-accent" />
                <h3 className="font-medium">File Details</h3>
              </div>
              <div className="pl-7">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="text-app-accent-dim mb-1">Size</div>
                    <div className="text-app-accent font-medium">
                      {(image.file.size / 1024).toFixed(1)} KB
                    </div>
                  </div>
                  <div>
                    <div className="text-app-accent-dim mb-1">Type</div>
                    <div className="text-app-accent font-medium">
                      {image.file.type.split('/')[1].toUpperCase()}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {showComparison && (
        <ImageComparison
          image={image}
          onClose={() => setShowComparison(false)}
        />
      )}
    </>
  );
};

export default ExifPanel;