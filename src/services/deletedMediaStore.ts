// Read legacy local exclusions without changing them. Network failures cannot
// prove that a family asset was deleted, so this store never writes new entries.

const STORAGE_KEY = 'our_circle_deleted_media_ids';

class DeletedMediaStore {
  private deletedSet: Set<string> = new Set();

  constructor() {
    this.loadFromStorage();
  }

  private loadFromStorage() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const arr = JSON.parse(saved);
        if (Array.isArray(arr)) {
          this.deletedSet = new Set(arr);
        }
      }
    } catch {
      // Ignore localStorage errors
    }
  }

  public isDeleted(id?: string, url?: string): boolean {
    if (id && this.deletedSet.has(id)) return true;
    if (url && this.deletedSet.has(url)) return true;
    return false;
  }

  public filterValid<T extends { id?: string; url?: string; videoUrl?: string; cardUrl?: string }>(items: T[]): T[] {
    return items.filter((item) => {
      if (item.id && this.isDeleted(item.id)) return false;
      if (item.url && this.isDeleted(item.url)) return false;
      if (item.videoUrl && this.isDeleted(item.videoUrl)) return false;
      if (item.cardUrl && this.isDeleted(item.cardUrl)) return false;
      return true;
    });
  }

}

export const deletedMediaStore = new DeletedMediaStore();
