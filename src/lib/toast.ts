import toast, { ToastOptions } from 'react-hot-toast';

const defaultOptions: ToastOptions = {
  duration: 4000,
  style: {
    background: 'var(--color-secondary)',
    color: 'var(--color-primary)',
    border: '1px solid var(--color-primary-light)',
    borderRadius: '0.75rem',
    fontSize: '14px',
    fontWeight: 500,
    padding: '12px 16px',
  },
};

const successOptions: ToastOptions = {
  ...defaultOptions,
  iconTheme: {
    primary: 'var(--color-success)',
    secondary: 'white',
  },
  style: {
    ...defaultOptions.style,
    border: '1px solid var(--color-success)',
  },
};

const errorOptions: ToastOptions = {
  ...defaultOptions,
  duration: 5000,
  iconTheme: {
    primary: 'var(--color-error)',
    secondary: 'white',
  },
  style: {
    ...defaultOptions.style,
    border: '1px solid var(--color-error)',
  },
};

const loadingOptions: ToastOptions = {
  ...defaultOptions,
  style: {
    ...defaultOptions.style,
    border: '1px solid var(--color-primary)',
  },
};

export const showToast = {
  success: (message: string, options?: ToastOptions) =>
    toast.success(message, { ...successOptions, ...options }),

  error: (message: string, options?: ToastOptions) =>
    toast.error(message, { ...errorOptions, ...options }),

  loading: (message: string, options?: ToastOptions) =>
    toast.loading(message, { ...loadingOptions, ...options }),

  promise: <T>(
    promise: Promise<T>,
    msgs: {
      loading: string;
      success: string;
      error: string;
    },
    options?: ToastOptions
  ) =>
    toast.promise(promise, msgs, { ...defaultOptions, ...options }),

  dismiss: (toastId?: string) => toast.dismiss(toastId),

  schoolAdded: () =>
    toast.success('?? School added successfully!', {
      ...successOptions,
      duration: 3000,
    }),

  networkError: () =>
    toast.error('Network error. Please check your connection and try again.', {
      ...errorOptions,
      duration: 6000,
    }),

  serverError: () =>
    toast.error('Server error. Please try again later.', {
      ...errorOptions,
      duration: 6000,
    }),

  validationError: (message: string) =>
    toast.error(`?? ${message}`, {
      ...errorOptions,
      duration: 4000,
    }),

  fileUploadError: () =>
    toast.error('Failed to upload image. Please try again.', {
      ...errorOptions,
      duration: 5000,
    }),

  databaseError: () =>
    toast.error('Database error. Please contact support if this persists.', {
      ...errorOptions,
      duration: 6000,
    }),
};

export default showToast;
