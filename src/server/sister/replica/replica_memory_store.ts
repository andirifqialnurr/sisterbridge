import type {
  ReplicaItem,
  ReplicaRunSummary,
  ReplicaSaveResult,
  ReplicaScope,
  ReplicaStore,
} from "./replica_repository";

type MemoryRecord = ReplicaScope & ReplicaItem & { deleted: boolean };

// In-memory ReplicaStore with the same soft-delete semantics as
// PrismaReplicaStore. Used by `sister:sync --dry-run` and by unit tests.
export class MemoryReplicaStore implements ReplicaStore {
  readonly records = new Map<string, MemoryRecord>();
  readonly runs = new Map<string, ReplicaRunSummary | null>();
  readonly fetchedScopes = new Set<string>();
  readonly failedScopes = new Map<string, number>();

  async ensureIntegration() {}

  async startRun() {
    const id = `run-${this.runs.size + 1}`;
    this.runs.set(id, null);
    return id;
  }

  async finishRun(runId: string, summary: ReplicaRunSummary) {
    this.runs.set(runId, summary);
  }

  async saveScope(
    _runId: string,
    _integrationId: string,
    scope: ReplicaScope,
    items: ReplicaItem[],
  ): Promise<ReplicaSaveResult> {
    const prefix = `${scope.endpoint}|${scope.scopeKey}|`;
    const result: ReplicaSaveResult = { created: 0, changed: 0, unchanged: 0, deleted: 0, changedKeys: [] };
    const seen = new Set<string>();

    for (const item of items) {
      const key = prefix + item.itemKey;
      seen.add(key);
      const existing = this.records.get(key);
      if (!existing) {
        result.created += 1;
        result.changedKeys.push(item.itemKey);
      } else if (existing.hash !== item.hash || existing.deleted) {
        result.changed += 1;
        result.changedKeys.push(item.itemKey);
      } else {
        result.unchanged += 1;
      }
      this.records.set(key, { ...scope, ...item, deleted: false });
    }

    const removedIds: string[] = [];
    for (const [key, record] of this.records) {
      if (key.startsWith(prefix) && !seen.has(key) && !record.deleted) {
        record.deleted = true;
        removedIds.push(record.itemKey);
        result.deleted += 1;
      }
    }
    for (const record of this.records.values()) {
      if (record.parentId && removedIds.includes(record.parentId) && !record.deleted) {
        record.deleted = true;
        result.deleted += 1;
      }
    }

    this.fetchedScopes.add(`${scope.endpoint}|${scope.scopeKey}`);
    this.failedScopes.delete(`${scope.endpoint}|${scope.scopeKey}`);
    return result;
  }

  async recordScopeFailure(
    _runId: string,
    _integrationId: string,
    scope: ReplicaScope,
    failure: { status: number },
  ) {
    this.failedScopes.set(`${scope.endpoint}|${scope.scopeKey}`, failure.status);
  }

  async fetchedScopeKeys(_integrationId: string, endpoint: string, scopeKeys: string[]) {
    return new Set(scopeKeys.filter((key) => this.fetchedScopes.has(`${endpoint}|${key}`)));
  }

  liveRecords(endpoint?: string) {
    return [...this.records.values()].filter(
      (record) => !record.deleted && (!endpoint || record.endpoint === endpoint),
    );
  }
}
