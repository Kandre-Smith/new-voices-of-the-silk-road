import { useRef, useState } from 'react';
import { submitFeedback } from '../api';
import { useApp } from '../store';
import Screen from '../components/Screen';

const MAX_CHARS = 1000;
const MAX_IMAGES = 3;

export default function Feedback() {
  const { lang, t } = useApp();
  const [text, setText] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const fileRef = useRef<HTMLInputElement>(null);

  function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    const remain = MAX_IMAGES - images.length;
    files.slice(0, remain).forEach((file) => {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          setImages((prev) => (prev.length < MAX_IMAGES ? [...prev, reader.result as string] : prev));
        }
      };
      reader.readAsDataURL(file);
    });
    if (fileRef.current) fileRef.current.value = '';
  }

  async function onSubmit() {
    if (!text.trim()) {
      setStatus('error');
      return;
    }
    setStatus('submitting');
    try {
      await submitFeedback({ text, images, lang });
      setStatus('success');
      setText('');
      setImages([]);
    } catch {
      setStatus('error');
    }
  }

  return (
    <Screen title={t('feedback.title')} back>
      <div className="page-pad">
        <div className="feedback-form card">
          <label className="feedback-label">{t('feedback.textLabel')}</label>
          <textarea
            className="feedback-textarea"
            value={text}
            maxLength={MAX_CHARS}
            placeholder={t('feedback.placeholder')}
            onChange={(e) => {
              setText(e.target.value);
              if (status !== 'idle') setStatus('idle');
            }}
          />
          <div className="feedback-count">
            {text.length}/{MAX_CHARS}
          </div>

          <label className="feedback-label">{t('feedback.imageLabel')}</label>
          <div className="feedback-images">
            {images.map((img, i) => (
              <div key={i} className="feedback-img">
                <img src={img} alt="" />
                <button
                  className="feedback-img-remove"
                  onClick={() => setImages((prev) => prev.filter((_, j) => j !== i))}
                  aria-label={t('feedback.removeImage')}
                >
                  ×
                </button>
              </div>
            ))}
            {images.length < MAX_IMAGES && (
              <button className="feedback-add" onClick={() => fileRef.current?.click()}>
                ＋
              </button>
            )}
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            multiple
            hidden
            onChange={onPick}
          />
        </div>

        {status === 'success' && <div className="form-msg ok">{t('feedback.success')}</div>}
        {status === 'error' && (
          <div className="form-msg err">{text.trim() ? t('feedback.error') : t('feedback.empty')}</div>
        )}

        <button
          className="btn btn-primary feedback-submit"
          onClick={onSubmit}
          disabled={status === 'submitting'}
        >
          {status === 'submitting' ? t('common.loading') : t('feedback.submit')}
        </button>
      </div>
    </Screen>
  );
}
