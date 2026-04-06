export default interface BucketDetails {
    bucket_name: string;
    visibility: string;
    allowed_users: string[] | null;
    owner: string;
    metadata: BucketMetadata;
    objects: BucketObject[];
    is_truncated: boolean;
    returned_items: number;
}

interface BucketObject {
    object_name: string;
    size_bytes: number;
    last_modified: string;
}

interface BucketMetadata {
    from_service: string;
    owner: string;
}
