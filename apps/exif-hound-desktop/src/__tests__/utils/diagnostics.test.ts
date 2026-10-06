import { fixCoordinates } from '../../utils/diagnostics';

describe('diagnostics utility', () => {
  describe('fixCoordinates', () => {
    it('returns coordinates unchanged — hemisphere guessing was removed', () => {
      // Regression: the old heuristic flipped valid eastern-hemisphere
      // coordinates (e.g. Tokyo 35.6762, 139.6503 landed in the Pacific),
      // mirroring markers and the reticle readout against the details panel.
      expect(fixCoordinates(35.6762, 139.6503)).toEqual([35.6762, 139.6503]);
      expect(fixCoordinates(-40.845872, 176.244019)).toEqual([-40.845872, 176.244019]);
      expect(fixCoordinates(40.7128, -74.0060)).toEqual([40.7128, -74.0060]);
    });

    it('returns null values unchanged', () => {
      expect(fixCoordinates(null, null)).toEqual([null, null]);
      expect(fixCoordinates(40.7128, null)).toEqual([40.7128, null]);
      expect(fixCoordinates(null, -74.0060)).toEqual([null, -74.0060]);
    });
  });
});