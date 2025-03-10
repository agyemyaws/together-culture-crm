import SignIn from "../components/Authentication/Sign_in";
import styles from "../components/Authentication/Authentication.module.css";

const LoginPage = () => {
  return (
    <div className={styles.pageContainer}>
      <div className={styles.formWrapper}>
        <SignIn />
      </div>
    </div>
  );
};

export default LoginPage;
