import { useMemo } from 'react';
import type { ImageData } from '../../../../types';
import { startOfDay, endOfDay, differenceInDays } from 'date-fns';

export interface TimelineNode {
  date: Date;
  count: number;
  images: ImageData[];
}

export const useTimelineNodes = (images: ImageData[]) => {
  return useMemo(() => {
    // Filter images that have datetime info
    const imagesWithDate = images.filter((img) => !!img.exif.dateTimeOriginal);
    
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
    const sortedImages = [...imagesWithDate].sort(
      (a, b) => new Date(a.exif.dateTimeOriginal!).getTime() - new Date(b.exif.dateTimeOriginal!).getTime()
    );
    
    const startDate = startOfDay(new Date(sortedImages[0].exif.dateTimeOriginal!));
    const endDate = endOfDay(new Date(sortedImages[sortedImages.length - 1].exif.dateTimeOriginal!));
    
    // Calculate time span in days
    const timespan = differenceInDays(endDate, startDate) + 1;
    
    // Group images by day
    const imagesByDay: { [key: string]: ImageData[] } = {};
    
    imagesWithDate.forEach((img) => {
      const day = startOfDay(new Date(img.exif.dateTimeOriginal!)).toISOString().split('T')[0];
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
    
    return {
      nodes,
      totalImagesWithDate: imagesWithDate.length,
      timespan,
      startDate,
      endDate
    };
  }, [images]);
}; 