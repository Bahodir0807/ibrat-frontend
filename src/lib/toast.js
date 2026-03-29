import { toast } from "sonner";

export function showErrorToast(error, fallback = "Something went wrong") {
  toast.error(error?.response?.data?.message || error?.message || fallback);
}

export function showSuccessToast(message) {
  toast.success(message);
}
