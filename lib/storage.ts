import { supabase } from './supabase'

export interface UploadResult {
    path: string
    url: string
    error?: string
}

export const uploadImage = async (
    file: File,
    bucket: string = 'avatars',
    folder: string = 'ai-assistants'
): Promise<UploadResult> => {
    try {
        // Generate unique filename
        const fileExt = file.name.split('.').pop()
        const fileName = `${folder}/${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`

        // Upload file to Supabase storage
        const { data, error } = await supabase.storage
            .from(bucket)
            .upload(fileName, file, {
                cacheControl: '3600',
                upsert: false
            })

        if (error) {
            throw error
        }

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
            .from(bucket)
            .getPublicUrl(fileName)

        return {
            path: fileName,
            url: publicUrl
        }
    } catch (error) {
        console.error('Error uploading image:', error)
        return {
            path: '',
            url: '',
            error: error instanceof Error ? error.message : 'Upload failed'
        }
    }
}

export const deleteImage = async (
    path: string,
    bucket: string = 'avatars'
): Promise<boolean> => {
    try {
        const { error } = await supabase.storage
            .from(bucket)
            .remove([path])

        if (error) {
            throw error
        }

        return true
    } catch (error) {
        console.error('Error deleting image:', error)
        return false
    }
}

export const getImageUrl = (
    path: string,
    bucket: string = 'avatars'
): string => {
    const { data: { publicUrl } } = supabase.storage
        .from(bucket)
        .getPublicUrl(path)

    return publicUrl
}

// Helper to validate image file
export const validateImageFile = (file: File): string | null => {
    const maxSize = 5 * 1024 * 1024 // 5MB
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']

    if (file.size > maxSize) {
        return 'File size must be less than 5MB'
    }

    if (!allowedTypes.includes(file.type)) {
        return 'File must be a JPEG, PNG, or WebP image'
    }

    return null
}

// Organization-specific image upload
export const uploadOrganizationImage = async (file: File): Promise<UploadResult> => {
    return uploadImage(file, 'avatars', 'organizations')
}

// Organization-specific image deletion
export const deleteOrganizationImage = async (path: string): Promise<boolean> => {
    return deleteImage(path, 'avatars')
}

// Demo system storage functions
export const uploadDemoUserImage = async (file: File): Promise<UploadResult> => {
    return uploadImage(file, 'avatars', 'demo-users')
}

export const deleteDemoUserImage = async (path: string): Promise<boolean> => {
    return deleteImage(path, 'avatars')
}

export const uploadPublicScenarioImage = async (file: File): Promise<UploadResult> => {
    return uploadImage(file, 'avatars', 'public-scenarios')
}

export const deletePublicScenarioImage = async (path: string): Promise<boolean> => {
    return deleteImage(path, 'avatars')
}

// Demo-specific image URL helpers
export const getDemoUserImageUrl = (path: string): string => {
    return getImageUrl(path, 'avatars')
}

export const getPublicScenarioImageUrl = (path: string): string => {
    return getImageUrl(path, 'avatars')
}