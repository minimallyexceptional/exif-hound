import React, { useState, useMemo } from 'react';
import { 
  ArrowLeft, 
  Clock, 
  FileText, 
  MapPin, 
  Camera, 
  Copy, 
  Check,
  Image as ImageIcon,
  Aperture,
  Sliders,
  Tag
} from 'lucide-react';
import { ImageData } from '../types';
import { Button } from './common/Button';
import { Panel } from './common/Panel';
import { formatDateTime, formatDateOnly } from '../utils/date';
import { formatLocation } from '../utils/geocoding';

interface Props {
  image: ImageData;
  rawExif: Record<string, unknown>;
  onBack: () => void;
}

interface ExifGroup {
  title: string;
  icon: React.ReactNode;
  properties: { key: string; value: string }[];
}

const FullExifView: React.FC<Props> = ({ image, rawExif, onBack }) => {
  const [copiedKeys, setCopiedKeys] = useState<Set<string>>(new Set());

  // Debug log the raw EXIF data
  console.log('Raw EXIF data:', rawExif);

  const handleCopy = async (key: string, value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopiedKeys(prev => {
        const next = new Set(prev);
        next.add(key);
        return next;
      });
      setTimeout(() => {
        setCopiedKeys(prev => {
          const next = new Set(prev);
          next.delete(key);
          return next;
        });
      }, 1500);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  const formatValue = (value: unknown): string => {
    // Format non-string values appropriately
    if (value === null || value === undefined) {
      return 'N/A';
    }
    if (typeof value === 'object') {
      return JSON.stringify(value);
    }
    return String(value);
  };

  const exifGroups = useMemo((): ExifGroup[] => {
    // Helper function to safely get EXIF values from the expanded structure
    const getExifValue = (section: string, tag: string) => {
      try {
        // Check if the section exists in the raw EXIF data
        if (rawExif && rawExif[section] && tag in (rawExif[section] as Record<string, unknown>)) {
          const value = (rawExif[section] as Record<string, unknown>)[tag];

          // Special formatting for date values
          if (tag.toLowerCase().includes('date') || tag.toLowerCase().includes('time')) {
            const strValue = formatValue(
              value && typeof value === 'object' && 'description' in value 
                ? (value as { description?: unknown }).description 
                : value
            );
            // Don't try to format if it's already "N/A"
            if (strValue === 'N/A') return strValue;
            
            // Use our enhanced date formatting for date/time fields
            if (tag === 'DateTimeOriginal' || tag === 'CreateDate' || tag === 'ModifyDate' || tag === 'DateTimeDigitized') {
              return formatDateTime(strValue);
            } else if (tag === 'DateStamp') {
              return formatDateOnly(strValue);
            }
          }
          
          return formatValue(
            value && typeof value === 'object' && 'description' in value 
              ? (value as { description?: unknown }).description 
              : value
          );
        }
        return 'N/A';
      } catch (err) {
        console.error(`Error getting EXIF value for ${section}.${tag}:`, err);
        return 'N/A';
      }
    };

    const groups: ExifGroup[] = [
      {
        title: 'Image Information',
        icon: <ImageIcon className="w-5 h-5 text-app-accent" />,
        properties: [
          { key: 'Image Width', value: getExifValue('ifd0', 'ImageWidth') },
          { key: 'Image Height', value: getExifValue('ifd0', 'ImageLength') },
          { key: 'Resolution X', value: getExifValue('ifd0', 'XResolution') },
          { key: 'Resolution Y', value: getExifValue('ifd0', 'YResolution') },
          { key: 'Resolution Unit', value: getExifValue('ifd0', 'ResolutionUnit') },
          { key: 'Color Space', value: getExifValue('exif', 'ColorSpace') },
          { key: 'Bits Per Sample', value: getExifValue('ifd0', 'BitsPerSample') },
          { key: 'Samples Per Pixel', value: getExifValue('ifd0', 'SamplesPerPixel') },
          { key: 'Image Description', value: getExifValue('ifd0', 'ImageDescription') },
          { key: 'Software', value: getExifValue('ifd0', 'Software') },
          { key: 'Artist', value: getExifValue('ifd0', 'Artist') },
          { key: 'Copyright', value: getExifValue('ifd0', 'Copyright') },
          { key: 'User Comment', value: getExifValue('exif', 'UserComment') },
          { key: 'Orientation', value: getExifValue('ifd0', 'Orientation') },
          { key: 'YCbCr Positioning', value: getExifValue('ifd0', 'YCbCrPositioning') },
          { key: 'Compression', value: getExifValue('ifd0', 'Compression') }
        ].filter(prop => prop.value !== 'N/A')
      },
      {
        title: 'Camera Information',
        icon: <Camera className="w-5 h-5 text-app-accent" />,
        properties: [
          { key: 'Make', value: getExifValue('ifd0', 'Make') },
          { key: 'Model', value: getExifValue('ifd0', 'Model') },
          { key: 'Lens Make', value: getExifValue('exif', 'LensMake') },
          { key: 'Lens Model', value: getExifValue('exif', 'LensModel') },
          { key: 'Serial Number', value: getExifValue('exif', 'BodySerialNumber') },
          { key: 'Camera Owner', value: getExifValue('exif', 'CameraOwnerName') },
          { key: 'Lens Serial Number', value: getExifValue('exif', 'LensSerialNumber') },
          { key: 'Camera ID', value: getExifValue('exif', 'CameraID') },
          { key: 'Lens ID', value: getExifValue('exif', 'LensID') }
        ].filter(prop => prop.value !== 'N/A')
      },
      {
        title: 'Exposure Settings',
        icon: <Aperture className="w-5 h-5 text-app-accent" />,
        properties: [
          { key: 'Exposure Time', value: getExifValue('exif', 'ExposureTime') },
          { key: 'F Number', value: getExifValue('exif', 'FNumber') },
          { key: 'ISO Speed', value: getExifValue('exif', 'ISOSpeedRatings') },
          { key: 'Exposure Program', value: getExifValue('exif', 'ExposureProgram') },
          { key: 'Exposure Mode', value: getExifValue('exif', 'ExposureMode') },
          { key: 'Exposure Bias', value: getExifValue('exif', 'ExposureBiasValue') },
          { key: 'Max Aperture', value: getExifValue('exif', 'MaxApertureValue') },
          { key: 'Metering Mode', value: getExifValue('exif', 'MeteringMode') },
          { key: 'Light Source', value: getExifValue('exif', 'LightSource') },
          { key: 'Flash', value: getExifValue('exif', 'Flash') },
          { key: 'Flash Energy', value: getExifValue('exif', 'FlashEnergy') },
          { key: 'Subject Distance', value: getExifValue('exif', 'SubjectDistance') },
          { key: 'Exposure Index', value: getExifValue('exif', 'ExposureIndex') },
          { key: 'Sensitivity Type', value: getExifValue('exif', 'SensitivityType') },
          { key: 'Recommended Exposure', value: getExifValue('exif', 'RecommendedExposureIndex') },
          { key: 'ISO Speed Ratings', value: getExifValue('exif', 'ISOSpeedRatings') }
        ].filter(prop => prop.value !== 'N/A')
      },
      {
        title: 'Lens Settings',
        icon: <Sliders className="w-5 h-5 text-app-accent" />,
        properties: [
          { key: 'Focal Length', value: getExifValue('exif', 'FocalLength') },
          { key: 'Focal Length 35mm', value: getExifValue('exif', 'FocalLengthIn35mmFilm') },
          { key: 'Digital Zoom Ratio', value: getExifValue('exif', 'DigitalZoomRatio') },
          { key: 'Focus Mode', value: getExifValue('exif', 'FocusMode') },
          { key: 'Focus Distance', value: getExifValue('exif', 'FocusDistance') },
          { key: 'Hyperfocal Distance', value: getExifValue('exif', 'HyperfocalDistance') },
          { key: 'Aperture Value', value: getExifValue('exif', 'ApertureValue') },
          { key: 'Lens Specification', value: getExifValue('exif', 'LensSpecification') }
        ].filter(prop => prop.value !== 'N/A')
      },
      {
        title: 'Image Quality',
        icon: <Tag className="w-5 h-5 text-app-accent" />,
        properties: [
          { key: 'White Balance', value: getExifValue('exif', 'WhiteBalance') },
          { key: 'Scene Type', value: getExifValue('exif', 'SceneType') },
          { key: 'Scene Capture Type', value: getExifValue('exif', 'SceneCaptureType') },
          { key: 'Contrast', value: getExifValue('exif', 'Contrast') },
          { key: 'Saturation', value: getExifValue('exif', 'Saturation') },
          { key: 'Sharpness', value: getExifValue('exif', 'Sharpness') },
          { key: 'Brightness', value: getExifValue('exif', 'BrightnessValue') },
          { key: 'Subject Distance Range', value: getExifValue('exif', 'SubjectDistanceRange') },
          { key: 'Gamma', value: getExifValue('exif', 'Gamma') },
          { key: 'Gain Control', value: getExifValue('exif', 'GainControl') },
          { key: 'Custom Rendered', value: getExifValue('exif', 'CustomRendered') },
          { key: 'Color Filter Array', value: getExifValue('exif', 'CFAPattern') }
        ].filter(prop => prop.value !== 'N/A')
      },
      {
        title: 'Date & Time',
        icon: <Clock className="w-5 h-5 text-app-accent" />,
        properties: [
          { key: 'Date Time Original', value: getExifValue('exif', 'DateTimeOriginal') },
          { key: 'Create Date', value: getExifValue('exif', 'CreateDate') },
          { key: 'Modify Date', value: getExifValue('ifd0', 'ModifyDate') },
          { key: 'Date Time Digitized', value: getExifValue('exif', 'DateTimeDigitized') },
          { key: 'Sub Sec Time', value: getExifValue('exif', 'SubSecTime') },
          { key: 'Sub Sec Time Original', value: getExifValue('exif', 'SubSecTimeOriginal') },
          { key: 'Sub Sec Time Digitized', value: getExifValue('exif', 'SubSecTimeDigitized') },
          { key: 'Time Zone Offset', value: getExifValue('exif', 'TimeZoneOffset') },
          { key: 'Date Stamp', value: getExifValue('exif', 'DateStamp') }
        ].filter(prop => prop.value !== 'N/A')
      },
      {
        title: 'Location',
        icon: <MapPin className="w-5 h-5 text-app-accent" />,
        properties: [
          ...(image.exif.location && !image.exif.location.loading ? [
            { key: 'Location', value: formatLocation(image.exif.location) }
          ] : []),
          { key: 'GPS Latitude', value: getExifValue('gps', 'Latitude') },
          { key: 'GPS Latitude Ref', value: getExifValue('gps', 'LatitudeRef') },
          { key: 'GPS Longitude', value: getExifValue('gps', 'Longitude') },
          { key: 'GPS Longitude Ref', value: getExifValue('gps', 'LongitudeRef') },
          { key: 'GPS Altitude', value: getExifValue('gps', 'Altitude') },
          { key: 'GPS Altitude Ref', value: getExifValue('gps', 'AltitudeRef') },
          { key: 'GPS Date Stamp', value: getExifValue('gps', 'DateStamp') },
          { key: 'GPS Time Stamp', value: getExifValue('gps', 'TimeStamp') },
          { key: 'GPS Speed', value: getExifValue('gps', 'Speed') },
          { key: 'GPS Speed Ref', value: getExifValue('gps', 'SpeedRef') },
          { key: 'GPS Direction', value: getExifValue('gps', 'ImgDirection') },
          { key: 'GPS Direction Ref', value: getExifValue('gps', 'ImgDirectionRef') },
          { key: 'GPS Processing Method', value: getExifValue('gps', 'ProcessingMethod') },
          { key: 'GPS Status', value: getExifValue('gps', 'Status') },
          { key: 'GPS Measure Mode', value: getExifValue('gps', 'MeasureMode') },
          { key: 'GPS Satellites', value: getExifValue('gps', 'Satellites') },
          { key: 'GPS Map Datum', value: getExifValue('gps', 'MapDatum') },
          { key: 'GPS Differential', value: getExifValue('gps', 'Differential') }
        ].filter(prop => prop.value !== 'N/A')
      },
      {
        title: 'File Details',
        icon: <FileText className="w-5 h-5 text-app-accent" />,
        properties: [
          { key: 'File Size', value: `${(image.file.size / 1024).toFixed(1)} KB` },
          { key: 'File Type', value: image.file.type.split('/')[1].toUpperCase() },
          { key: 'MIME Type', value: image.file.type },
          { key: 'Last Modified', value: formatDateTime(new Date(image.file.lastModified).toISOString()) }
        ]
      }
    ];

    // Filter out empty groups
    return groups.filter(group => group.properties.length > 0);
  }, [rawExif, image.file]);

  // Debug log the processed groups
  console.log('Processed EXIF groups:', exifGroups);

  const header = (
    <div className="flex items-center gap-2 min-w-0 px-4 py-2 border-b border-app-gray-light/10">
      <Button
        variant="ghost"
        onClick={onBack}
        className="flex items-center gap-1 text-app-accent hover:text-app-white -ml-2"
        icon={<ArrowLeft className="w-5 h-5" />}
      >
        Back to Details
      </Button>
      <span className="text-app-accent-dim">/</span>
      <span className="text-app-white font-medium">Data</span>
    </div>
  );

  return (
    <Panel className="flex flex-col h-full">
      {header}
      <div className="flex-1 overflow-y-auto">
        <div className="p-4 space-y-6">
          {exifGroups.map((group) => (
            <div key={group.title} className="space-y-3">
              <div className="flex items-center gap-2 text-app-white border-b border-app-gray-light/10 pb-2">
                {group.icon}
                <h3 className="font-medium">{group.title}</h3>
              </div>
              <div className="grid grid-cols-1 gap-2">
                {group.properties.map(({ key, value }) => (
                  <div 
                    key={key}
                    className="flex items-start justify-between gap-4 py-2 px-3 rounded hover:bg-app-gray-light/10 group"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-medium text-app-accent-dim">
                        {key}
                      </div>
                      <div 
                        className="text-sm text-app-white break-words cursor-pointer whitespace-pre-wrap"
                        onClick={() => handleCopy(key, value)}
                      >
                        {value}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      onClick={() => handleCopy(key, value)}
                      className="p-1.5 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                      tooltip="Copy to clipboard"
                      aria-label="Copy to clipboard"
                    >
                      {copiedKeys.has(key) ? (
                        <Check className="w-4 h-4" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </Panel>
  );
};

export default FullExifView;