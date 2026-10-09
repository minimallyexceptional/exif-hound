import { joinPath } from '../src/format';

describe('native project paths', () => {
  it('joins Linux and macOS roots with forward slashes', () => {
    expect(joinPath('/home/user/Projects/', 'Case/data/data.db'))
      .toBe('/home/user/Projects/Case/data/data.db');
    expect(joinPath('/Users/user/Projects', 'Case/images'))
      .toBe('/Users/user/Projects/Case/images');
  });

  it('joins Windows drive and UNC roots with backslashes', () => {
    expect(joinPath('C:\\Users\\user\\Projects\\', 'Case/data/data.db'))
      .toBe('C:\\Users\\user\\Projects\\Case\\data\\data.db');
    expect(joinPath('\\\\server\\share\\Projects', 'Case/images'))
      .toBe('\\\\server\\share\\Projects\\Case\\images');
    expect(joinPath('C:/Users/user/Projects/', 'Case/data/data.db'))
      .toBe('C:\\Users\\user\\Projects\\Case\\data\\data.db');
  });
});
