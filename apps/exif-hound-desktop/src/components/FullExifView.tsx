import React, { useMemo, useState } from 'react';
import {
  Aperture,
  Camera,
  Check,
  Clock,
  Copy,
  FileText,
  Image as ImageIcon,
  MapPin,
  Sliders,
  Tag,
} from 'lucide-react';
import type { ExpandedTags } from 'exif-hound-core';
import { formatLocation } from 'exif-hound-core';
import { ImageData } from '../types';
import { Button } from './common/Button';
import { formatDateOnly, formatDateTime } from '../utils/date';
import {
  formatExifTagForCopy,
  formatExifTagForDisplay,
  getExpandedExifTag,
  resolveColorSpaceLabel,
} from '../utils/exifTagDisplay';
import { formatFileType } from '../utils/formatFileType';
import { notify } from '../feedback';

interface Props {
  image: ImageData;
  rawExif: ExpandedTags;
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

function withFallback(property: ExifProperty, fallback?: string | number | null): ExifProperty {
  if (property.displayValue !== 'N/A') return property;
  if (fallback === null || fallback === undefined || fallback === '') {
    return property;
  }
  const displayValue = String(fallback);
  return { ...property, displayValue, copyValue: displayValue };
}

const FullExifView: React.FC<Props> = ({ image, rawExif }) => {
  const [copiedKeys, setCopiedKeys] = useState<ReadonlySet<string>>(new Set());

  const handleCopy = async (key: string, copyValue: string) => {
    try {
      await navigator.clipboard.writeText(copyValue);
      setCopiedKeys((prev) => {
        const next = new Set(prev);
        next.add(key);
        return next;
      });
      notify.success('Copied to clipboard.');
      setTimeout(() => {
        setCopiedKeys((prev) => {
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

      return { key: label, displayValue, copyValue: copyValue === 'N/A' ? displayValue : copyValue };
    };

    const colorSpaceDisplay = resolveColorSpaceLabel(rawExif);
    const hasValidCoordinates =
      typeof image.exif.latitude === 'number' && typeof image.exif.longitude === 'number';
    const coordinates = hasValidCoordinates
      ? `${(image.exif.latitude as number).toFixed(6)}, ${(image.exif.longitude as number).toFixed(6)}`
      : 'No location data available';
    const dateTaken = withFallback(
      readTag('Date Taken', ['DateTimeOriginal']),
      image.exif.dateTimeOriginal ? formatDateTime(image.exif.dateTimeOriginal) : 'Not available',
    );
    if (dateTaken.displayValue === 'N/A') {
      dateTaken.displayValue = 'Not available';
      dateTaken.copyValue = 'Not available';
    }

    const seen = new Set<string>();
    const keepAll = (properties: ExifProperty[]): ExifProperty[] => {
      for (const property of properties) seen.add(property.key);
      return properties;
    };
    const extras = (properties: ExifProperty[]): ExifProperty[] => (
      properties.filter((property) => {
        if (property.displayValue === 'N/A' || seen.has(property.key)) return false;
        seen.add(property.key);
        return true;
      })
    );

    const groups: ExifGroup[] = [
      {
        title: 'Location',
        icon: <MapPin className="w-5 h-5 text-app-accent" />,
        properties: keepAll([
          ...(image.exif.location && !image.exif.location.loading
            ? [{
                key: 'Place',
                displayValue: formatLocation(image.exif.location),
                copyValue: formatLocation(image.exif.location),
              }]
            : image.exif.location?.loading
              ? [{
                  key: 'Place',
                  displayValue: 'Loading location data...',
                  copyValue: 'Loading location data...',
                }]
              : []),
          {
            key: 'Coordinates',
            displayValue: coordinates,
            copyValue: coordinates,
          },
          ...extras([
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
          ]),
        ]),
      },
      {
        title: 'Date Taken',
        icon: <Clock className="w-5 h-5 text-app-accent" />,
        properties: keepAll([
          dateTaken,
          ...extras([
            readTag('Create Date', ['CreateDate']),
            readTag('Modify Date', ['ModifyDate']),
            readTag('Date Time Digitized', ['DateTimeDigitized']),
            readTag('Sub Sec Time', ['SubSecTime']),
            readTag('Sub Sec Time Original', ['SubSecTimeOriginal']),
            readTag('Sub Sec Time Digitized', ['SubSecTimeDigitized']),
            readTag('Time Zone Offset', ['TimeZoneOffset']),
            readTag('Date Stamp', ['DateStamp']),
          ]),
        ]),
      },
      {
        title: 'Camera Details',
        icon: <Camera className="w-5 h-5 text-app-accent" />,
        properties: keepAll([
          withFallback(readTag('Make', ['Make']), image.exif.make),
          withFallback(readTag('Model', ['Model']), image.exif.model),
          withFallback(readTag('Exposure Time', ['ExposureTime']), image.exif.exposureTime),
          withFallback(readTag('F-Number', ['FNumber']), image.exif.fNumber),
          withFallback(readTag('ISO', ['ISOSpeedRatings']), image.exif.iso),
          withFallback(
            readTag('Focal Length', ['FocalLength']),
            typeof image.exif.focalLength === 'number' ? `${image.exif.focalLength}mm` : null,
          ),
          ...extras([
            readTag('Lens Make', ['LensMake', 'Lens Make']),
            readTag('Lens Model', ['LensModel', 'Lens Model']),
            readTag('Serial Number', ['BodySerialNumber']),
            readTag('Camera Owner', ['CameraOwnerName']),
            readTag('Lens Serial Number', ['LensSerialNumber']),
            readTag('Camera ID', ['CameraID']),
            readTag('Lens ID', ['LensID']),
          ]),
        ]),
      },
      {
        title: 'File Details',
        icon: <FileText className="w-5 h-5 text-app-accent" />,
        properties: keepAll([
          {
            key: 'Size',
            displayValue: `${(image.file.size / 1024).toFixed(1)} KB`,
            copyValue: String(image.file.size),
          },
          {
            key: 'Type',
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
            displayValue: Number.isFinite(image.file.lastModified)
              ? formatDateTime(new Date(image.file.lastModified).toISOString())
              : 'N/A',
            copyValue: Number.isFinite(image.file.lastModified)
              ? new Date(image.file.lastModified).toISOString()
              : 'N/A',
          },
        ]),
      },
      {
        title: 'Image Information',
        icon: <ImageIcon className="w-5 h-5 text-app-accent" />,
        properties: extras([
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
        ]),
      },
      {
        title: 'Exposure Settings',
        icon: <Aperture className="w-5 h-5 text-app-accent" />,
        properties: extras([
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
        ]),
      },
      {
        title: 'Lens Settings',
        icon: <Sliders className="w-5 h-5 text-app-accent" />,
        properties: extras([
          readTag('Focal Length 35mm', ['FocalLengthIn35mmFilm']),
          readTag('Digital Zoom Ratio', ['DigitalZoomRatio']),
          readTag('Focus Mode', ['FocusMode']),
          readTag('Focus Distance', ['FocusDistance']),
          readTag('Hyperfocal Distance', ['HyperfocalDistance']),
          readTag('Aperture Value', ['ApertureValue']),
          readTag('Lens Specification', ['LensSpecification']),
        ]),
      },
      {
        title: 'Image Quality',
        icon: <Tag className="w-5 h-5 text-app-accent" />,
        properties: extras([
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
        ]),
      },
    ];

    return groups.filter((group) => group.properties.length > 0);
  }, [rawExif, image]);

  return (
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
  );
};

export default FullExifView;
