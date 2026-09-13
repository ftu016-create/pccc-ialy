import { UserRole } from '../types';

const PIN_STORAGE_KEY = 'pccc_ialy_admin_pin_v1';
const ROLE_STORAGE_KEY = 'pccc_ialy_user_role_v1';
const PIN_UPDATED_AT_KEY = 'pccc_ialy_pin_updated_at_v1';

// Default PIN matching atvsld-ialy
export const DEFAULT_PIN = 'ialy2026';

// Cloud sync endpoints (Cross-device synchronization for Vercel, GitHub, and local)
const CLOUD_ENDPOINTS = [
  'https://api.restful-api.dev/objects/ff808181a067127101a09a4df5a50866',
  'https://api.restful-api.dev/objects/ff808181a067127101a09a4e6f830869',
];

type PinChangeCallback = (newPin: string) => void;
type RoleChangeCallback = (newRole: UserRole) => void;

class AdminAuthService {
  private pinCallbacks: Set<PinChangeCallback> = new Set();
  private roleCallbacks: Set<RoleChangeCallback> = new Set();
  private isSyncing = false;
  private cachedPin: string = DEFAULT_PIN;

  constructor() {
    // Sync cloud pin on window focus so other machine changes are picked up immediately
    if (typeof window !== 'undefined') {
      window.addEventListener('focus', () => {
        this.fetchRemotePin();
      });
      // Periodic check every 30 seconds
      setInterval(() => {
        this.fetchRemotePin();
      }, 30000);
      // Run once at startup
      this.fetchRemotePin();
    }
  }

  getUserRole(): UserRole {
    if (typeof window === 'undefined') return 'viewer';
    const saved = localStorage.getItem(ROLE_STORAGE_KEY);
    return saved === 'admin' ? 'admin' : 'viewer';
  }

  setUserRole(role: UserRole): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(ROLE_STORAGE_KEY, role);
    this.roleCallbacks.forEach((cb) => cb(role));
  }

  getPin(): string {
    if (typeof window !== 'undefined') {
      const pin = localStorage.getItem(PIN_STORAGE_KEY);
      if (pin && pin.trim().length >= 4) {
        return pin.trim();
      }
    }
    return this.cachedPin || DEFAULT_PIN;
  }

  verifyPin(inputPin: string): boolean {
    const current = this.getPin();
    return inputPin.trim() === current;
  }

  async updatePin(oldPin: string, newPin: string): Promise<{ success: boolean; message: string }> {
    // Sync freshest PIN from cloud first
    await this.fetchRemotePin(true);

    const current = this.getPin();
    if (oldPin.trim() !== current) {
      return { success: false, message: 'Mã PIN cũ không chính xác. Bạn không có quyền đổi mã PIN.' };
    }

    const cleaned = newPin.trim();
    if (cleaned.length < 4) {
      return { success: false, message: 'Mã PIN mới phải từ 4 ký tự trở lên.' };
    }

    if (cleaned === current) {
      return { success: false, message: 'Mã PIN mới không được trùng với mã PIN hiện tại.' };
    }

    // Update local storage first
    const nowIso = new Date().toISOString();
    this.cachedPin = cleaned;
    if (typeof window !== 'undefined') {
      localStorage.setItem(PIN_STORAGE_KEY, cleaned);
      localStorage.setItem(PIN_UPDATED_AT_KEY, nowIso);
    }
    this.pinCallbacks.forEach((cb) => cb(cleaned));

    // Await Broadcast to Cloud Sync endpoints so other machines get updated immediately
    const isSynced = await this.broadcastPinToCloud(cleaned, nowIso);

    return {
      success: true,
      message: isSynced
        ? 'Đã đổi mã PIN Admin thành công và đồng bộ tới tất cả máy tính!'
        : 'Đã đổi mã PIN Admin thành công trên máy (đang đồng bộ đám mây)!',
    };
  }

  async broadcastPinToCloud(pin: string, updatedAt: string): Promise<boolean> {
    let successCount = 0;
    const promises = CLOUD_ENDPOINTS.map(async (url) => {
      try {
        const res = await fetch(url, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: 'pccc_ialy_pin_config',
            data: { pin, updated_at: updatedAt },
          }),
        });
        if (res.ok) {
          successCount++;
        }
      } catch (err) {
        console.warn('Failed to sync PIN to endpoint:', url, err);
      }
    });

    try {
      await Promise.allSettled(promises);
    } catch (e) {
      // Ignored
    }

    return successCount > 0;
  }

  async fetchRemotePin(force = false): Promise<string | null> {
    if (this.isSyncing && !force) return null;
    this.isSyncing = true;

    try {
      for (const url of CLOUD_ENDPOINTS) {
        try {
          const cacheBuster = `${url}?_t=${Date.now()}`;
          const res = await fetch(cacheBuster, {
            cache: 'no-store',
            headers: { 'Cache-Control': 'no-cache, no-store, must-revalidate', Pragma: 'no-cache' },
          });
          if (res.ok) {
            const json = await res.json();
            const remotePin = json?.data?.pin;
            const remoteUpdatedAt = json?.data?.updated_at;

            if (remotePin && typeof remotePin === 'string' && remotePin.trim().length >= 4) {
              const currentLocal = this.getPin();
              this.cachedPin = remotePin.trim();

              if (remotePin.trim() !== currentLocal) {
                if (typeof window !== 'undefined') {
                  localStorage.setItem(PIN_STORAGE_KEY, remotePin.trim());
                  if (remoteUpdatedAt) {
                    localStorage.setItem(PIN_UPDATED_AT_KEY, remoteUpdatedAt);
                  }
                }
                this.pinCallbacks.forEach((cb) => cb(remotePin.trim()));
              }
              return remotePin.trim();
            }
          }
        } catch (e) {
          // try next endpoint
        }
      }
    } finally {
      this.isSyncing = false;
    }
    return null;
  }

  async verifyPinAsync(inputPin: string): Promise<boolean> {
    const trimmed = inputPin.trim();
    if (!trimmed) return false;

    // Check fast local cache first
    if (trimmed === this.getPin()) {
      return true;
    }

    // If not matching local, fetch fresh PIN from cloud to ensure another machine's update is caught
    const remotePin = await this.fetchRemotePin(true);
    if (remotePin && trimmed === remotePin) {
      return true;
    }

    return trimmed === this.getPin();
  }

  onPinChange(callback: PinChangeCallback): () => void {
    this.pinCallbacks.add(callback);
    return () => this.pinCallbacks.delete(callback);
  }

  onRoleChange(callback: RoleChangeCallback): () => void {
    this.roleCallbacks.add(callback);
    return () => this.roleCallbacks.delete(callback);
  }

  subscribe(callback: RoleChangeCallback): () => void {
    return this.onRoleChange(callback);
  }

  logout(): void {
    this.setUserRole('viewer');
  }

  login(): void {
    this.setUserRole('admin');
  }
}

export const adminAuthService = new AdminAuthService();
