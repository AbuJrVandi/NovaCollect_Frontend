import styles from './AuthLayout.module.css';

export default function AuthLayout({ children, title, subtitle }) {
  return (
    <div className={styles.root}>
      <div className={styles.brand}>
        <div className={styles.brandPattern} />
        <div className={styles.brandBlobTop} />
        <div className={styles.brandBlobBottom} />
        <div className={styles.brandBlobMid} />

        <div className={styles.brandContent}>
          <div className={styles.brandLogo}>
            <div className={styles.brandLogoIcon}>
              <span>N</span>
            </div>
            <span className={styles.brandLogoText}>NovaCollect</span>
          </div>

          <div className={styles.brandText}>
            <h2 className={styles.brandHeading}>
              Data collection,<br />
              <span className={styles.brandAccent}>simplified.</span>
            </h2>
            <p className={styles.brandSubtext}>
              Build intelligent forms, gather submissions, and unlock insights — all in one workspace.
            </p>
            <div className={styles.brandSocial}>
              <div className={styles.avatarStack}>
                {[...Array(4)].map((_, i) => (
                  <div key={i} className={styles.avatar}>
                    {String.fromCharCode(65 + i)}
                  </div>
                ))}
              </div>
              <p className={styles.brandSocialText}>
                Trusted by teams worldwide
              </p>
            </div>
          </div>

          <p className={styles.brandFooter}>&copy; 2026 NovaCollect. All rights reserved.</p>
        </div>
      </div>

      <div className={styles.formPanel}>
        <div className={styles.formContainer}>
          <div className={styles.mobileLogo}>
            <div className={styles.mobileLogoIcon}>
              <span>N</span>
            </div>
            <span className={styles.mobileLogoText}>NovaCollect</span>
          </div>

          <div className={styles.formContent}>
            <h1 className={styles.formTitle}>{title}</h1>
            <p className={styles.formSubtitle}>{subtitle}</p>
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
