import { HOME_FAQ } from './homeFaqData';

export default function HomeFaq() {
  return (
    <section className="section-faq-wrapper" id="faq">
      <div className="section-container">
        <div className="faq-layout-grid">
          <div className="faq-content-left">
            <div className="section-kicker">FAQ</div>
            <h2 className="faq-header-title">Questions before you get started.</h2>
            <p className="faq-header-intro">Clear answers about how Corvioz fits into your client workflow.</p>
          </div>
          <div className="faq-list-container">
            {HOME_FAQ.map((item, index) => (
              <details className="faq-row-item" key={item.question} open={index < 3}>
                <summary className="faq-summary">
                  <span>{item.question}</span>
                  <span className="faq-icon-indicator" aria-hidden="true">+</span>
                </summary>
                <div className="faq-answer-content">{item.answer}</div>
              </details>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
