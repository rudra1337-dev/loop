import { useCallback, useEffect, useRef, useState } from 'react';
import { askFeedback } from '../../services/feedbackService';
import { useTheme } from '../../context/ThemeContext';
import './AskLoop.css';

const SENTIMENT_LABEL = {
  POS: 'Positive',
  NEU: 'Neutral',
  NEG: 'Negative',
};

const createMessageId = () =>
  `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

function AskLoop() {
  const { resolvedTheme } = useTheme();

  const [question, setQuestion] = useState('');
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const inputRef = useRef(null);
  const messagesEndRef = useRef(null);
  const composerRef = useRef(null);

  const updateKeyboardPosition = useCallback(() => {
    const composer = composerRef.current;

    if (!composer || !window.visualViewport) return;

    const viewport = window.visualViewport;

    const keyboardHeight = Math.max(
      0,
      window.innerHeight - viewport.height - viewport.offsetTop
    );

    composer.style.setProperty(
      '--keyboard-offset',
      `${keyboardHeight}px`
    );
  }, []);

  useEffect(() => {
    const viewport = window.visualViewport;

    if (!viewport) return undefined;

    updateKeyboardPosition();

    viewport.addEventListener('resize', updateKeyboardPosition);
    viewport.addEventListener('scroll', updateKeyboardPosition);

    return () => {
      viewport.removeEventListener('resize', updateKeyboardPosition);
      viewport.removeEventListener('scroll', updateKeyboardPosition);
    };
  }, [updateKeyboardPosition]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: 'smooth',
      block: 'end',
    });
  }, [messages, loading]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const q = question.trim();

    if (!q || loading) return;

    const userMessage = {
      id: createMessageId(),
      role: 'user',
      content: q,
    };

    setMessages((prev) => [...prev, userMessage]);
    setQuestion('');
    setError(null);
    setLoading(true);

    try {
      /*
       * Keep the original API contract.
       *
       * q is exactly what is sent to the backend.
       */
      const res = await askFeedback(q);

      /*
       * Keep the original backend response untouched.
       */
      const payload = res.data;

      const assistantMessage = {
        id: createMessageId(),
        role: 'assistant',
        answer: payload.answer,
        sources: payload.sources || [],
        hasEvidence: payload.hasEvidence,
        followUp: payload.followUp || null,
        response: payload,
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err) {
      setError(
        err.response?.data?.error ||
          'Something went wrong asking that question. Please try again.'
      );
    } finally {
      setLoading(false);

      requestAnimationFrame(() => {
        inputRef.current?.focus();
      });
    }
  };

  const handleInputKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();

      if (!loading && question.trim()) {
        handleSubmit(e);
      }
    }
  };

  const handleFollowUp = (followUp) => {
    setQuestion(followUp);

    requestAnimationFrame(() => {
      inputRef.current?.focus();
    });
  };

  const isEmpty = messages.length === 0;

  return (
    <main
      className={`ask-loop ask-loop--${resolvedTheme}`}
      aria-label="Ask LOOP"
    >
      <div className="ask-loop__shell">
        <section
          className={`ask-loop__conversation ${
            isEmpty ? 'ask-loop__conversation--empty' : ''
          }`}
          aria-live="polite"
          aria-label="Conversation"
        >
          {isEmpty ? (
            <div className="ask-loop__welcome">
              <div
                className="ask-loop__welcome-icon"
                aria-hidden="true"
              >
                ✦
              </div>

              <h1>How can I help?</h1>

              <p>
                Ask anything about your workspace feedback.
                <br className="d-none d-sm-inline" />
                {' '}
                LOOP will ground its answers in your real feedback.
              </p>

              <div className="ask-loop__suggestions">
                <button
                  type="button"
                  onClick={() =>
                    handleFollowUp(
                      'What are users saying about onboarding?'
                    )
                  }
                >
                  What are users saying about onboarding?
                </button>

                <button
                  type="button"
                  onClick={() =>
                    handleFollowUp(
                      'What are the biggest complaints from users?'
                    )
                  }
                >
                  What are the biggest complaints?
                </button>

                <button
                  type="button"
                  onClick={() =>
                    handleFollowUp(
                      'What do users like most about the product?'
                    )
                  }
                >
                  What do users like most?
                </button>
              </div>
            </div>
          ) : (
            <div className="ask-loop__messages">
              {messages.map((message) => {
                if (message.role === 'user') {
                  return (
                    <div
                      key={message.id}
                      className="ask-loop__message-row ask-loop__message-row--user"
                    >
                      <div className="ask-loop__message ask-loop__message--user">
                        <div className="ask-loop__message-content">
                          {message.content}
                        </div>
                      </div>
                    </div>
                  );
                }

                return (
                  <div
                    key={message.id}
                    className="ask-loop__message-row ask-loop__message-row--assistant"
                  >
                    <div
                      className="ask-loop__assistant-avatar"
                      aria-hidden="true"
                    >
                      ✦
                    </div>

                    <div className="ask-loop__assistant-content">
                      {/* AI RESPONSE */}
                      <div
                        className={`ask-loop__message ask-loop__message--assistant ${
                          message.hasEvidence === false
                            ? 'ask-loop__message--no-evidence'
                            : ''
                        }`}
                      >
                        <div className="ask-loop__message-content">
                          {message.answer}
                        </div>
                      </div>

                      {/* SOURCES */}
                      {message.sources?.length > 0 && (
                        <div className="ask-loop__sources">
                          <div className="ask-loop__sources-header">
                            Based on {message.sources.length} feedback{' '}
                            {message.sources.length === 1
                              ? 'item'
                              : 'items'}
                          </div>

                          <div className="ask-loop__source-list">
                            {message.sources.map((source) => (
                              <article
                                key={source.id}
                                className="ask-loop__source"
                              >
                                <div className="ask-loop__source-meta">
                                  {source.sentiment && (
                                    <span
                                      className={`ask-loop__sentiment ask-loop__sentiment--${source.sentiment.toLowerCase()}`}
                                    >
                                      {SENTIMENT_LABEL[
                                        source.sentiment
                                      ] || source.sentiment}
                                    </span>
                                  )}

                                  {source.channel && (
                                    <span>{source.channel}</span>
                                  )}

                                  {typeof source.similarity ===
                                    'number' && (
                                    <span>
                                      Match{' '}
                                      {(
                                        source.similarity * 100
                                      ).toFixed(0)}
                                      %
                                    </span>
                                  )}
                                </div>

                                <p>{source.content}</p>
                              </article>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* FOLLOW-UP — AFTER THE RESULT */}
                      {message.followUp && (
                        <button
                          type="button"
                          className="ask-loop__followup"
                          onClick={() =>
                            handleFollowUp(message.followUp)
                          }
                          aria-label={`Ask follow-up: ${message.followUp}`}
                        >
                          <span
                            className="ask-loop__followup-icon"
                            aria-hidden="true"
                          >
                            ↗
                          </span>

                          <span>{message.followUp}</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}

              {loading && (
                <div className="ask-loop__message-row ask-loop__message-row--assistant">
                  <div
                    className="ask-loop__assistant-avatar"
                    aria-hidden="true"
                  >
                    ✦
                  </div>

                  <div className="ask-loop__message ask-loop__message--assistant ask-loop__message--loading">
                    <span className="visually-hidden">
                      LOOP is generating a response
                    </span>

                    <div className="ask-loop__typing">
                      <span />
                      <span />
                      <span />
                    </div>
                  </div>
                </div>
              )}

              {error && (
                <div
                  className="ask-loop__error"
                  role="alert"
                >
                  <span aria-hidden="true">!</span>
                  <span>{error}</span>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          )}
        </section>

        {/* CENTERED COMPOSER */}
        <div
          ref={composerRef}
          className="ask-loop__composer-wrapper"
        >
          <form
            className="ask-loop__composer"
            onSubmit={handleSubmit}
          >
            <div className="ask-loop__input-container">
              <textarea
                ref={inputRef}
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                onKeyDown={handleInputKeyDown}
                placeholder="Message Ask LOOP..."
                rows={1}
                disabled={loading}
                aria-label="Message Ask LOOP"
              />

              <button
                type="submit"
                className="ask-loop__send"
                disabled={loading || !question.trim()}
                aria-label="Send message"
              >
                {loading ? (
                  <span
                    className="ask-loop__send-spinner"
                    aria-hidden="true"
                  />
                ) : (
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    aria-hidden="true"
                  >
                    <path
                      d="M5 12h13M13 6l6 6-6 6"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                )}
              </button>
            </div>

            <div className="ask-loop__hint">
              Enter to send · Shift + Enter for a new line
            </div>
          </form>
        </div>
      </div>
    </main>
  );
}

export default AskLoop;