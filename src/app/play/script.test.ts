import { describe, expect, it } from 'vitest';
import { twistForVoice, whoForVoice } from './script';

describe('whoForVoice', () => {
  it('names the Partner instead of a second "you"', () => {
    expect(whoForVoice('A librarian who needs you to return a book.', 'Ben')).toBe(
      'A librarian who needs Ben to return a book.',
    );
  });

  it('names the Partner once, then says "their"', () => {
    expect(whoForVoice('A robot vacuum who needs you to lift your feet. Again.', 'Ben')).toBe(
      'A robot vacuum who needs Ben to lift their feet. Again.',
    );
  });

  it('makes a first "your" the Partner’s', () => {
    expect(whoForVoice('A tooth fairy who needs to borrow one of your teeth.', 'Ben')).toBe(
      'A tooth fairy who needs to borrow one of Ben’s teeth.',
    );
  });
});

describe('twistForVoice', () => {
  it('puts real names in place of the roles', () => {
    expect(twistForVoice('It is the Partner’s birthday, and the Opener forgot.', 'Ana', 'Ben')).toBe(
      'It is Ben’s birthday, and Ana forgot.',
    );
  });
});
