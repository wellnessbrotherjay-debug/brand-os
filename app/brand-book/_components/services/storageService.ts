
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const uploadAsset = async (file: File, brandId: string, projectId?: string) => {
    try {
        const fileExt = file.name.split('.').pop();
        const fileName = `${brandId}/${projectId || 'general'}/${crypto.randomUUID()}.${fileExt}`;
        const filePath = `assets/${fileName}`;

        const { data, error } = await supabase.storage
            .from('brand-os-assets')
            .upload(filePath, file);

        if (error) throw error;

        const { data: { publicUrl } } = supabase.storage
            .from('brand-os-assets')
            .getPublicUrl(filePath);

        return publicUrl;
    } catch (error) {
        console.error('Error uploading asset:', error);
        throw error;
    }
};

export const deleteAssetFromStorage = async (url: string) => {
    try {
        // Extract path from URL (Assuming standard Supabase URL structure)
        // URL format: https://[project].supabase.co/storage/v1/object/public/[bucket]/[path]
        const bucketMatch = url.match(/\/storage\/v1\/object\/public\/([^\/]+)\/(.+)/);
        if (!bucketMatch) return;

        const bucket = bucketMatch[1];
        const path = bucketMatch[2];

        const { error } = await supabase.storage
            .from(bucket)
            .remove([path]);

        if (error) throw error;
    } catch (error) {
        console.error('Error deleting asset:', error);
    }
};
