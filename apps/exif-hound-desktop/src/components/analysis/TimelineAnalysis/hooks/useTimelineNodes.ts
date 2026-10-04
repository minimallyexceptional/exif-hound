import { useMemo } from 'react';
import type { ImageData } from '../../../../types';

// Native Date helpers (replace date-fns)
const startOfDay = (d: Date): Date => {
  const c = new Date(d);
  c.setHours(0, 0, 0, 0);
  return c;
};
const endOfDay = (d: Date): Date => {
  const c = new Date(d);
  c.setHours(23, 59, 59, 999);
  return c;
};
const differenceInDays = (later: Date, earlier: Date): number =>
  Math.round((startOfDay(later).getTime() - startOfDay(earlier).getTime()) / 86_400_000);

export interface TimelineNode {
  date: Date;
  count: number;
  images: ImageData[];
}

// Helper function to correctly parse EXIF dates which may have different formats
const parseExifDate = (dateString: string | undefined | null): Date | null => {
  if (!dateString) return null;
  
  try {
    // EXIF dates often use colon as separator in the date part (YYYY:MM:DD)
    // We need to replace them with hyphens for proper parsing
    const fixedDateString = dateString.replace(/(\d{4}):(\d{2}):(\d{2})/, '$1-$2-$3');
    const date = new Date(fixedDateString);
    
    // Check if the date is valid
    if (isNaN(date.getTime())) {
      console.warn(`Invalid date format: ${dateString}`);
      return null;
    }
    
    return date;
  } catch (error) {
    console.error(`Error parsing date: ${dateString}`, error);
    return null;
  }
};

export const useTimelineNodes = (images: ImageData[]) => {
  return useMemo(() => {
    console.log('Processing timeline nodes for images:', images.length);
    
    // Filter images that have datetime info and can be properly parsed
    const imagesWithDate = images.filter((img) => {
      const parsedDate = parseExifDate(img.exif.dateTimeOriginal);
      return parsedDate !== null;
    });
    
    console.log('Images with valid dates:', imagesWithDate.length);
    
    if (imagesWithDate.length === 0) {
      return {
        nodes: [],
        totalImagesWithDate: 0,
        timespan: 0,
        startDate: null,
        endDate: null
      };
    }

    // Find the min and max dates
    const sortedImages = [...imagesWithDate].sort((a, b) => {
      const dateA = parseExifDate(a.exif.dateTimeOriginal!)!.getTime();
      const dateB = parseExifDate(b.exif.dateTimeOriginal!)!.getTime();
      return dateA - dateB;
    });
    
    const startDate = startOfDay(parseExifDate(sortedImages[0].exif.dateTimeOriginal!)!);
    const endDate = endOfDay(parseExifDate(sortedImages[sortedImages.length - 1].exif.dateTimeOriginal!)!);
    
    // Calculate time span in days
    const timespan = differenceInDays(endDate, startDate) + 1;
    
    // Group images by day
    const imagesByDay: { [key: string]: ImageData[] } = {};
    
    imagesWithDate.forEach((img) => {
      const parsedDate = parseExifDate(img.exif.dateTimeOriginal!);
      if (!parsedDate) return;
      
      const day = startOfDay(parsedDate).toISOString().split('T')[0];
      if (!imagesByDay[day]) {
        imagesByDay[day] = [];
      }
      imagesByDay[day].push(img);
    });
    
    // Create nodes for each day with images
    const nodes: TimelineNode[] = Object.entries(imagesByDay).map(([day, dayImages]) => ({
      date: new Date(day),
      count: dayImages.length,
      images: dayImages,
    }));
    
    console.log('Created timeline nodes:', nodes.length);
    
    return {
      nodes,
      totalImagesWithDate: imagesWithDate.length,
      timespan,
      startDate,
      endDate
    };
  }, [images]);
}; 