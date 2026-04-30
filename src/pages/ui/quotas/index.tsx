import getUserQuotaApi from "@/api/quotas/getQuotaApi";
import GenericTopbar from "@/components/Topbar";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import { errorMessage } from "@/lib/error";
import { ClusterUserQuota } from "@/models/clusterUserQuota";
import { Search } from "lucide-react";
import { useState } from "react";
import EditPopover from "./components/EditPopover";
import QuotaEmptyState from "./components/QuotaEmptyState";
import QuotaLoadingState from "./components/QuotaLoadingState";
import QuotaSummary from "./components/QuotaSummary";

type LoadQuotaOptions = {
  userId?: string;
  preserveExisting?: boolean;
};

function Quotas() {
  const { authData } = useAuth();
  const adminMode = authData.user === "oscar";
  const personalMode = Boolean(authData.egiSession) && !adminMode;
  const [quota, setQuota] = useState<ClusterUserQuota | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [lastLoadedUid, setLastLoadedUid] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [inputError, setInputError] = useState("");
  const [hasSearched, setHasSearched] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);

  async function loadQuota({ userId, preserveExisting = false }: LoadQuotaOptions = {}) {
    const normalizedUserId = userId?.trim();
    setInputError("");
    setError("");

    if (adminMode && !normalizedUserId) {
      setInputError("Enter a user ID before loading quota.");
      return;
    }

    setLoading(true);
    setHasSearched(true);
    try {
      const loadedQuota = await getUserQuotaApi(adminMode ? normalizedUserId : undefined);
      const loadedUserId = loadedQuota.user_id || normalizedUserId || authData.egiSession?.sub || "";
      setQuota(loadedQuota);
      setLastLoadedUid(loadedUserId);
      if (adminMode) {
        setSearchQuery(loadedUserId);
      }
    } catch (loadError) {
      if (!preserveExisting) {
        setQuota(null);
        setLastLoadedUid("");
      }
      setError(errorMessage(loadError));
    } finally {
      setLoading(false);
    }
  }

  const refreshQuota = async () => {
    await loadQuota({
      userId: adminMode ? lastLoadedUid : undefined,
      preserveExisting: true,
    });
  };

  const topbarActions = adminMode ? (
    <div className="grid w-full gap-2 px-3 py-2 sm:grid-cols-[minmax(0,1fr)_auto]">
      <Input
        placeholder="User ID"
        value={searchQuery}
        onChange={(event) => {
          setSearchQuery(event.target.value);
          if (inputError) setInputError("");
        }}
        onKeyDown={(event) => {
          if (event.key === "Enter") loadQuota({ userId: searchQuery });
        }}
        endIcon={<Search size={16} />}
        aria-invalid={Boolean(inputError)}
      />
      <Button onClick={() => loadQuota({ userId: searchQuery })} disabled={loading}>
        <Search size={16} className="mr-2" />
        {loading ? "Loading" : "Load quota"}
      </Button>
    </div>
  ) : undefined;

  const topbarRefresher = personalMode || (adminMode && lastLoadedUid) ? refreshQuota : undefined;
  const userId = quota?.user_id || lastLoadedUid;

  return (
    <div className="h-full w-full overflow-auto">
      <GenericTopbar
        defaultHeader={{ title: "Quotas", linkTo: "/ui/quotas" }}
        refresher={topbarRefresher}
        secondaryRow={topbarActions}
      />

      <div className="w-full max-w-full mx-auto px-4 pt-6 pb-6 space-y-6">
        {!adminMode && !personalMode && (
          <Alert variant="destructive">
            <AlertTitle>Quotas unavailable</AlertTitle>
            <AlertDescription>
              Personal quota lookup is available for OIDC users. Admin quota management is available for oscar.
            </AlertDescription>
          </Alert>
        )}

        {inputError && (
          <Alert variant="destructive">
            <AlertTitle>Missing user ID</AlertTitle>
            <AlertDescription>{inputError}</AlertDescription>
          </Alert>
        )}

        {error && (
          <Alert variant="destructive">
            <AlertTitle>Quota could not be loaded</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {loading && !quota ? (
          <QuotaLoadingState />
        ) : quota ? (
          <QuotaSummary
            quota={quota}
            userId={userId}
            adminMode={adminMode}
            onEdit={() => setIsEditOpen(true)}
          />
        ) : (
          <QuotaEmptyState hasSearched={hasSearched} adminMode={adminMode} />
        )}
      </div>

      {adminMode && quota && (
        <EditPopover
          isOpen={isEditOpen}
          setIsOpen={setIsEditOpen}
          user={quota}
          onSaved={refreshQuota}
        />
      )}
    </div>
  );
}

export default Quotas;
