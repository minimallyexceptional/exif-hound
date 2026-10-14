import {
  Car, FileSearch, Globe, Mail, MapPin, Phone, ScanText, type LucideIcon,
} from 'lucide-react';
import type { EvidenceCategoryId } from 'exif-hound-core';

export const EVIDENCE_CATEGORY_ICONS: Record<EvidenceCategoryId, LucideIcon> = {
  'license-plates': Car,
  'phone-numbers': Phone,
  emails: Mail,
  urls: Globe,
  'text-coordinates': MapPin,
  'gps-locations': MapPin,
  'ocr-text': ScanText,
  provenance: FileSearch,
};
