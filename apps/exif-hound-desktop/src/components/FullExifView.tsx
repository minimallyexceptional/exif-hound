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
import type { ExpandedTags } from 'exif-hound-core';
import { Button } from './common/Button';
import { Panel } from './common/Panel';
import { formatDateTime, formatDateOnly } from '../utils/date';
import { formatLocation } from 'exif-hound-core';
import { formatFileType } from '../utils/formatFileType';
import {
  formatExifTagForCopy,
  formatExifTagForDisplay,
  getExpandedExifTag,
  resolveColorSpaceLabel,
} from '../utils/exifTagDisplay';
import { notify } from '../feedback';

interface Props {
  image: ImageData;
  rawExif: ExpandedTags;
  onBack: () => void;
}

interface ExifProperty {
  key: string;
  displayValue: string;
  copyValue: string;
}

interface ExifGroup {
  title: string;
  icon: React.ReactNode;
  properties: ExifProperty[];
}

const FullExifView: React.FC<Props> = ({ image, rawExif, onBack }) => {
  const [copiedKeys, setCopiedKeys] = useState<Set<string>>(new Set());

  const handleCopy = async (key: string, copyValue: string) => {
    try {
      await navigator.clipboard.writeText(copyValue);
      setCopiedKeys(prev => {
        const next = new Set(prev);
        next.add(key);
        return next;
      });
      notify.success('Copied to clipboard.');
      setTimeout(() => {
        setCopiedKeys(prev => {
          const next = new Set(prev);
          next.delete(key);
          return next;
        });
      }, 1500);
    } catch (err) {
      if (__DEV__) console.error('Failed to copy text: ', err);
      notify.error('Clipboard access is unavailable.');
    }
  };

  const exifGroups = useMemo((): ExifGroup[] => {
    const readTag = (
      label: string,
      tagCandidates: string[],
      sections: string[] = ['exif', 'file', 'jfif', 'gps', 'Thumbnail', 'icc']
    ): ExifProperty => {
      const tagData = getExpandedExifTag(rawExif, tagCandidates, sections);
      let displayValue = formatExifTagForDisplay(tagData);
      const copyValue = formatExifTagForCopy(tagData);

      const primaryTag = tagCandidates[0];
      if (
        primaryTag.toLowerCase().includes('date') ||
        primaryTag.toLowerCase().includes('time')
      ) {
        const strValue = copyValue === 'N/A' ? displayValue : copyValue;
        if (strValue !== 'N/A') {
          if (
            primaryTag === 'DateTimeOriginal' ||
            primaryTag === 'CreateDate' ||
            primaryTag === 'ModifyDate' ||
            primaryTag === 'DateTimeDigitized'
          ) {
            displayValue = formatDateTime(strValue);
          } else if (primaryTag === 'DateStamp') {
            displayValue = formatDateOnly(strValue);
          }
        }
      }

      return { key: label, displayValue, copyValue };
    };

    const colorSpaceDisplay = resolveColorSpaceLabel(rawExif);

    const groups: ExifGroup[] = [
      {
        title: 'Image Information',
        icon: <ImageIcon className="w-5 h-5 text-app-accent" />,
        properties: [
          readTag('Image Width', ['Image Width'], ['file']),
          readTag('Image Height', ['Image Height'], ['file']),
          readTag('Resolution X', ['XResolution'], ['jfif', 'exif']),
          readTag('Resolution Y', ['YResolution'], ['jfif', 'exif']),
          readTag('Resolution Unit', ['Resolution Unit', 'ResolutionUnit'], ['jfif', 'exif']),
          {
            key: 'Color Space',
            displayValue: colorSpaceDisplay,
            copyValue: colorSpaceDisplay,
          },
          readTag('Bits Per Sample', ['Bits Per Sample', 'BitsPerSample'], ['file', 'exif']),
          readTag('Samples Per Pixel', ['Samples Per Pixel', 'SamplesPerPixel'], ['exif', 'file']),
          readTag('Image Description', ['ImageDescription', 'Image Description']),
          readTag('Software', ['Software']),
          readTag('Artist', ['Artist']),
          readTag('Copyright', ['Copyright']),
          readTag('User Comment', ['UserComment', 'User Comment']),
          readTag('Orientation', ['Orientation']),
          readTag('YCbCr Positioning', ['YCbCrPositioning', 'YCbCr Positioning']),
          readTag('Compression', ['Compression'], ['exif', 'file', 'jfif']),
        ].filter(prop => prop.displayValue !== 'N/A')
      },
      {
        title: 'Camera Information',
        icon: <Camera className="w-5 h-5 text-app-accent" />,
        properties: [
          readTag('Make', ['Make']),
          readTag('Model', ['Model']),
          readTag('Lens Make', ['LensMake', 'Lens Make']),
          readTag('Lens Model', ['LensModel', 'Lens Model']),
          readTag('Serial Number', ['BodySerialNumber']),
          readTag('Camera Owner', ['CameraOwnerName']),
          readTag('Lens Serial Number', ['LensSerialNumber']),
          readTag('Camera ID', ['CameraID']),
          readTag('Lens ID', ['LensID']),
        ].filter(prop => prop.displayValue !== 'N/A')
      },
      {
        title: 'Exposure Settings',
        icon: <Aperture className="w-5 h-5 text-app-accent" />,
        properties: [
          readTag('Exposure Time', ['ExposureTime']),
          readTag('F Number', ['FNumber']),
          readTag('ISO Speed', ['ISOSpeedRatings']),
          readTag('Exposure Program', ['ExposureProgram']),
          readTag('Exposure Mode', ['ExposureMode']),
          readTag('Exposure Bias', ['ExposureBiasValue']),
          readTag('Max Aperture', ['MaxApertureValue']),
          readTag('Metering Mode', ['MeteringMode']),
          readTag('Light Source', ['LightSource']),
          readTag('Flash', ['Flash']),
          readTag('Flash Energy', ['FlashEnergy']),
          readTag('Subject Distance', ['SubjectDistance']),
          readTag('Exposure Index', ['ExposureIndex']),
          readTag('Sensitivity Type', ['SensitivityType']),
          readTag('Recommended Exposure', ['RecommendedExposureIndex']),
          readTag('ISO Speed Ratings', ['ISOSpeedRatings']),
        ].filter(prop => prop.displayValue !== 'N/A')
      },
      {
        title: 'Lens Settings',
        icon: <Sliders className="w-5 h-5 text-app-accent" />,
        properties: [
          readTag('Focal Length', ['FocalLength']),
          readTag('Focal Length 35mm', ['FocalLengthIn35mmFilm']),
          readTag('Digital Zoom Ratio', ['DigitalZoomRatio']),
          readTag('Focus Mode', ['FocusMode']),
          readTag('Focus Distance', ['FocusDistance']),
          readTag('Hyperfocal Distance', ['HyperfocalDistance']),
          readTag('Aperture Value', ['ApertureValue']),
          readTag('Lens Specification', ['LensSpecification']),
        ].filter(prop => prop.displayValue !== 'N/A')
      },
      {
        title: 'Image Quality',
        icon: <Tag className="w-5 h-5 text-app-accent" />,
        properties: [
          readTag('White Balance', ['WhiteBalance']),
          readTag('Scene Type', ['SceneType']),
          readTag('Scene Capture Type', ['SceneCaptureType']),
          readTag('Contrast', ['Contrast']),
          readTag('Saturation', ['Saturation']),
          readTag('Sharpness', ['Sharpness']),
          readTag('Brightness', ['BrightnessValue']),
          readTag('Subject Distance Range', ['SubjectDistanceRange']),
          readTag('Gamma', ['Gamma']),
          readTag('Gain Control', ['GainControl']),
          readTag('Custom Rendered', ['CustomRendered']),
          readTag('Color Filter Array', ['CFAPattern']),
        ].filter(prop => prop.displayValue !== 'N/A')
      },
      {
        title: 'Date & Time',
        icon: <Clock className="w-5 h-5 text-app-accent" />,
        properties: [
          readTag('Date Time Original', ['DateTimeOriginal']),
          readTag('Create Date', ['CreateDate']),
          readTag('Modify Date', ['ModifyDate']),
          readTag('Date Time Digitized', ['DateTimeDigitized']),
          readTag('Sub Sec Time', ['SubSecTime']),
          readTag('Sub Sec Time Original', ['SubSecTimeOriginal']),
          readTag('Sub Sec Time Digitized', ['SubSecTimeDigitized']),
          readTag('Time Zone Offset', ['TimeZoneOffset']),
          readTag('Date Stamp', ['DateStamp']),
        ].filter(prop => prop.displayValue !== 'N/A')
      },
      {
        title: 'Location',
        icon: <MapPin className="w-5 h-5 text-app-accent" />,
        properties: [
          ...(image.exif.location && !image.exif.location.loading
            ? [
                {
                  key: 'Location',
                  displayValue: formatLocation(image.exif.location),
                  copyValue: formatLocation(image.exif.location),
                },
              ]
            : []),
          readTag('GPS Latitude', ['Latitude'], ['gps', 'exif']),
          readTag('GPS Latitude Ref', ['GPSLatitudeRef']),
          readTag('GPS Longitude', ['Longitude'], ['gps', 'exif']),
          readTag('GPS Longitude Ref', ['GPSLongitudeRef']),
          readTag('GPS Altitude', ['Altitude'], ['gps', 'exif']),
          readTag('GPS Altitude Ref', ['AltitudeRef'], ['gps', 'exif']),
          readTag('GPS Date Stamp', ['DateStamp'], ['gps', 'exif']),
          readTag('GPS Time Stamp', ['TimeStamp'], ['gps', 'exif']),
          readTag('GPS Speed', ['Speed'], ['gps', 'exif']),
          readTag('GPS Speed Ref', ['SpeedRef'], ['gps', 'exif']),
          readTag('GPS Direction', ['ImgDirection'], ['gps', 'exif']),
          readTag('GPS Direction Ref', ['ImgDirectionRef'], ['gps', 'exif']),
          readTag('GPS Processing Method', ['ProcessingMethod'], ['gps', 'exif']),
          readTag('GPS Status', ['Status'], ['gps', 'exif']),
          readTag('GPS Measure Mode', ['MeasureMode'], ['gps', 'exif']),
          readTag('GPS Satellites', ['Satellites'], ['gps', 'exif']),
          readTag('GPS Map Datum', ['MapDatum'], ['gps', 'exif']),
          readTag('GPS Differential', ['Differential'], ['gps', 'exif']),
        ].filter(prop => prop.displayValue !== 'N/A')
      },
      {
        title: 'File Details',
        icon: <FileText className="w-5 h-5 text-app-accent" />,
        properties: [
          {
            key: 'File Size',
            displayValue: `${(image.file.size / 1024).toFixed(1)} KB`,
            copyValue: String(image.file.size),
          },
          {
            key: 'File Type',
            displayValue: formatFileType(image.file.type),
            copyValue: formatFileType(image.file.type),
          },
          {
            key: 'MIME Type',
            displayValue: image.file.type || 'N/A',
            copyValue: image.file.type || 'N/A',
          },
          {
            key: 'Last Modified',
            displayValue: formatDateTime(new Date(image.file.lastModified).toISOString()),
            copyValue: new Date(image.file.lastModified).toISOString(),
          },
        ]
      }
    ];

    // Filter out empty groups
    return groups.filter(group => group.properties.length > 0);
  }, [rawExif, image.file, image.exif.location]);

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
                {group.properties.map(({ key, displayValue, copyValue }) => (
                  <div 
                    key={key}
                    className="flex items-start justify-between gap-4 py-2 px-3 rounded hover:bg-app-gray-light/10 group"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-medium text-app-accent-dim">
                        {key}
                      </div>
                      <div 
                        className="text-sm text-app-white break-words cursor-pointer whitespace-pre-wrap selectable-value"
                        onClick={() => handleCopy(key, copyValue)}
                      >
                        {displayValue}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      onClick={() => handleCopy(key, copyValue)}
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
