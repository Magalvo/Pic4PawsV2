import type { SupabaseClientLike } from './pet-supabase';
import type { MediaAssetReadRepository } from './media-url';

export const createSupabaseMediaAssetReadRepository = ({
  client,
}: {
  client: SupabaseClientLike;
}): MediaAssetReadRepository => ({
  getMediaAsset: async (mediaId) => {
    const result = await client
      .from('media_assets')
      .select('r2_object_key, visibility')
      .eq('id', mediaId)
      .maybeSingle();

    const row = result.data as { r2_object_key: string; visibility: string } | null;
    if (!row) return null;

    return {
      objectKey: row.r2_object_key,
      visibility: row.visibility as 'public' | 'private',
    };
  },
});
