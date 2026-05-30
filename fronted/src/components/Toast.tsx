import toast from "react-hot-toast";
import { Check, AlertCircle } from "lucide-react";

export const showSuccessToast = (message: string) => {
  toast.custom((t) => (
    <div className={`${t.visible ? 'animate-enter' : 'animate-leave'} w-auto min-w-[260px] bg-[#f0fdf4] shadow-md rounded-xl pointer-events-auto flex ring-1 ring-black/5`}>
      <div className="flex-1 p-3">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 bg-[#dcfce7] rounded-full flex items-center justify-center flex-shrink-0">
            <Check className="h-4 w-4 text-[#16a34a]" strokeWidth={3} />
          </div>
          <p className="text-[14px] font-semibold text-[#166534] pr-2">
            {message}
          </p>
        </div>
      </div>
      <div className="flex border-l border-green-100">
        <button
          onClick={() => toast.dismiss(t.id)}
          className="w-full border border-transparent rounded-none rounded-r-xl px-3 py-2 flex items-center justify-center text-sm font-medium text-green-600 hover:text-green-500 hover:bg-green-50 focus:outline-none transition-colors"
        >
          ✕
        </button>
      </div>
    </div>
  ));
};

export const showErrorToast = (message: string) => {
  toast.custom((t) => (
    <div className={`${t.visible ? 'animate-enter' : 'animate-leave'} w-auto min-w-[260px] bg-[#fef2f2] shadow-md rounded-xl pointer-events-auto flex ring-1 ring-black/5`}>
      <div className="flex-1 p-3">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 bg-[#fee2e2] rounded-full flex items-center justify-center flex-shrink-0">
            <AlertCircle className="h-4 w-4 text-[#dc2626]" strokeWidth={3} />
          </div>
          <p className="text-[14px] font-semibold text-[#991b1b] pr-2">
            {message}
          </p>
        </div>
      </div>
      <div className="flex border-l border-red-100">
        <button
          onClick={() => toast.dismiss(t.id)}
          className="w-full border border-transparent rounded-none rounded-r-xl px-3 py-2 flex items-center justify-center text-sm font-medium text-red-600 hover:text-red-500 hover:bg-red-50 focus:outline-none transition-colors"
        >
          ✕
        </button>
      </div>
    </div>
  ));
};
