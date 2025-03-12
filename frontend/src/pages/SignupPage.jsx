import SignUp from "../components/Authentication/Sign_up";
import styles from "../components/Authentication/Authentication.module.css";

const SignUpPage = () => {
  return (
    <div className={styles.pageContainer}>
      <div className={styles.formWrapper}>
        <SignUp route={"/auth/register"} method={"register"} />
      </div>
    </div>
  );
};

export default SignUpPage;
