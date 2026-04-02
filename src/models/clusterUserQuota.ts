export type ClusterUserQuota = {
    user_id?: string;
    cluster_queue?: string;
    resources: Resources;
};

type Resources = {
    cpu: ResourceDetail;
    memory: ResourceDetail;
};

type ResourceDetail = {
    max: number;
    used: number;
};  

export type QuotaUpdateRequest = {
	cpu: string;
	memory: string;
}