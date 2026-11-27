import { userService } from './userService';

export interface DeleteAccountInput {
  confirmation: string;
  password?: string;
}

export async function deleteAccount(input: { data: DeleteAccountInput } | DeleteAccountInput) {
  const confirmation = 'data' in input ? input.data.confirmation : input.confirmation;
  const password = 'data' in input ? (input.data.password || '') : (input.password || '');

  if (confirmation !== 'DELETE') {
    throw new Error('Type DELETE to confirm.');
  }

  return userService.deleteAccount(confirmation, password);
}
