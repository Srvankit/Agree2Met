import { createServerFn } from '@tanstack/react-start';

export const deleteAccount = createServerFn({ method: 'POST' })
  .inputValidator((input: { confirmation: string }) => {
    if (input.confirmation !== 'DELETE') throw new Error('Type DELETE to confirm.');
    return input;
  })
  .handler(async () => {
    return { deleted: true };
  });
