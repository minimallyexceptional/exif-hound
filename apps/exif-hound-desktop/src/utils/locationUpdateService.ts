/**
 * Background Location Update Service
 * Handles progressive location updates for images without blocking the UI
 */

import { getLocationFromCoordinates, LocationData } from './geocoding';

export interface LocationUpdateRequest {
  imageId: string;
  latitude: number;
  longitude: number;
  onUpdate: (imageId: string, location: LocationData) => void;
}

class LocationUpdateService {
  private queue: LocationUpdateRequest[] = [];
  private isProcessing = false;
  private readonly maxConcurrency = 1; // Respect rate limits

  /**
   * Add a location update request to the queue
   */
  public enqueue(request: LocationUpdateRequest): void {
    this.queue.push(request);
    this.processQueue();
  }

  /**
   * Process the queue of location update requests
   */
  private async processQueue(): Promise<void> {
    if (this.isProcessing || this.queue.length === 0) {
      return;
    }

    this.isProcessing = true;

    while (this.queue.length > 0) {
      const request = this.queue.shift()!;
      
      try {
        if (__DEV__) {
          console.log(`[LocationService] Processing location update for image ${request.imageId}`);
        }

        const locationData = await getLocationFromCoordinates(
          request.latitude,
          request.longitude
        );

        // Call the update callback
        request.onUpdate(request.imageId, locationData);

        if (__DEV__) {
          console.log(`[LocationService] Location updated for image ${request.imageId}:`, locationData);
        }
      } catch (error) {
        if (__DEV__) {
          console.error(`[LocationService] Failed to update location for image ${request.imageId}:`, error);
        }

        // Call the callback with error state
        request.onUpdate(request.imageId, {
          loading: false,
          error: 'Failed to fetch location data'
        });
      }
    }

    this.isProcessing = false;
  }

  /**
   * Clear all pending requests
   */
  public clear(): void {
    this.queue.length = 0;
  }

  /**
   * Get the number of pending requests
   */
  public getQueueLength(): number {
    return this.queue.length;
  }
}

// Export singleton instance
export const locationUpdateService = new LocationUpdateService();
