import { createServerClient } from '@/lib/db/server';
import { createClient } from '@supabase/supabase-js';

export type CredentialProvider = 'elevenlabs' | 'youtube' | 'pexels' | 'openai';

interface Credential {
  id: string;
  user_id: string;
  provider: CredentialProvider;
  encrypted_key: string;
  is_valid: boolean;
  last_validated_at: string | null;
  created_at: string;
  updated_at: string;
}

// Simple encryption using base64 (in production, use proper encryption with Supabase Vault)
function encryptKey(key: string): string {
  return Buffer.from(key).toString('base64');
}

function decryptKey(encrypted: string): string {
  return Buffer.from(encrypted, 'base64').toString('utf-8');
}

export class CredentialManager {
  private supabase;

  constructor() {
    // Use service role for credential management (bypasses RLS)
    this.supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
  }

  async getCredential(userId: string, provider: CredentialProvider): Promise<string | null> {
    const { data, error } = await this.supabase
      .from('credentials')
      .select('encrypted_key, is_valid')
      .eq('user_id', userId)
      .eq('provider', provider)
      .single();

    if (error || !data || !data.is_valid) {
      return null;
    }

    return decryptKey(data.encrypted_key);
  }

  async setCredential(userId: string, provider: CredentialProvider, key: string): Promise<boolean> {
    const encrypted = encryptKey(key);

    const { error } = await this.supabase
      .from('credentials')
      .upsert({
        user_id: userId,
        provider,
        encrypted_key: encrypted,
        is_valid: true,
        last_validated_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id,provider',
      });

    return !error;
  }

  async deleteCredential(userId: string, provider: CredentialProvider): Promise<boolean> {
    const { error } = await this.supabase
      .from('credentials')
      .delete()
      .eq('user_id', userId)
      .eq('provider', provider);

    return !error;
  }

  async validateCredential(userId: string, provider: CredentialProvider): Promise<boolean> {
    const key = await this.getCredential(userId, provider);
    if (!key) return false;

    // Basic validation - check if key exists and has correct format
    let isValid = false;
    switch (provider) {
      case 'elevenlabs':
        isValid = key.startsWith('sk_') && key.length > 20;
        break;
      case 'youtube':
        isValid = key.length > 10; // OAuth token
        break;
      case 'pexels':
        isValid = key.length > 10;
        break;
      case 'openai':
        isValid = key.startsWith('sk-') && key.length > 20;
        break;
      default:
        isValid = key.length > 0;
    }

    // Update validation status
    await this.supabase
      .from('credentials')
      .update({
        is_valid: isValid,
        last_validated_at: new Date().toISOString(),
      })
      .eq('user_id', userId)
      .eq('provider', provider);

    return isValid;
  }

  async listCredentials(userId: string): Promise<{ provider: CredentialProvider; isValid: boolean; lastValidated: string | null }[]> {
    const { data, error } = await this.supabase
      .from('credentials')
      .select('provider, is_valid, last_validated_at')
      .eq('user_id', userId);

    if (error || !data) return [];

    return data.map((c) => ({
      provider: c.provider as CredentialProvider,
      isValid: c.is_valid,
      lastValidated: c.last_validated_at,
    }));
  }
}

// Singleton instance
export const credentialManager = new CredentialManager();
