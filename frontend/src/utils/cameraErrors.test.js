import { describe, it, expect } from 'vitest';
import { cameraErrorMessage } from './cameraErrors';

describe('cameraErrorMessage', () => {
  it('explains a blocked camera with how to allow it', () => {
    const msg = cameraErrorMessage({ name: 'NotAllowedError', message: 'Permission denied' });
    expect(msg.title).toBe('Camera access is blocked');
    expect(msg.help).toMatch(/iPhone/);
  });
  it('names a missing or busy camera', () => {
    expect(cameraErrorMessage({ name: 'NotFoundError' }).title).toBe('No camera found');
    expect(cameraErrorMessage({ name: 'NotReadableError' }).title).toBe('The camera is busy');
  });
  it('falls back to a general message', () => {
    expect(cameraErrorMessage('something odd').title).toBe('The camera did not start');
  });
});
