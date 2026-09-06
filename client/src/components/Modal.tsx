import { useEffect, useRef, useState, type ReactNode } from 'react';

interface ModalProps {
  open: boolean;
  title?: string;
  children: ReactNode;
  confirmText?: string;
  cancelText?: string;
  showCancel?: boolean;
  onConfirm?: () => void;
  onCancel?: () => void;
  onClose: () => void;
}

/**
 * Vant 风格弹窗（自研，零第三方依赖）：遮罩 + 圆角卡片 + 底部按钮。
 * 点击遮罩或「确认」均关闭；点卡片内容区不冒泡关闭。
 */
export function Modal({
  open,
  title,
  children,
  confirmText,
  cancelText,
  showCancel,
  onConfirm,
  onCancel,
  onClose,
}: ModalProps) {
  if (!open) return null;
  return (
    <div className="vant-modal-overlay" onClick={onClose}>
      <div className="vant-modal" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
        {title && <div className="vant-modal-title">{title}</div>}
        <div className="vant-modal-body">{children}</div>
        <div className="vant-modal-footer">
          {showCancel && (
            <button type="button" className="vant-btn vant-btn-cancel" onClick={onCancel ?? onClose}>
              {cancelText}
            </button>
          )}
          <button type="button" className="vant-btn vant-btn-confirm" onClick={onConfirm ?? onClose}>
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}

/** 轻量 Toast（Vant 风格），2 秒后自动消失；返回 [节点, 显示函数] */
export function useToast(): [ReactNode, (msg: string) => void] {
  const [toast, setToast] = useState<{ msg: string; id: number } | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  const show = (msg: string) => {
    if (timer.current) clearTimeout(timer.current);
    setToast({ msg, id: Date.now() });
    timer.current = setTimeout(() => setToast(null), 2000);
  };

  const node = toast ? (
    <div className="vant-toast" key={toast.id}>
      {toast.msg}
    </div>
  ) : null;

  return [node, show];
}
