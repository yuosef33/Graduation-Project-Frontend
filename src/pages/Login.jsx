import { useFormik } from "formik";
import * as Yup from "yup";
import { Link, useNavigate , Navigate  } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import InputField from "../components/InputField";
import toast from "react-hot-toast";

const BASE_URL = "http://localhost:8080";

const validationSchema = Yup.object({
  email: Yup.string().email("Invalid email").required("Email is required"),
  password: Yup.string().required("Password is required"),
});

const Login = () => {
  const { login , user  } = useAuth();
  const navigate = useNavigate();



  const formik = useFormik({
    initialValues: { email: "", password: "" },
    validationSchema,
    onSubmit: async (values, { setSubmitting }) => {
       try {
          const res = await login(values.email, values.password);
          console.log("role after login:", res.role); // ← add this
        toast.success("Welcome back!");
        // redirect based on role
        if (res.role === "ADMIN") {
            navigate("/admin");
        } else {
            navigate("/home");
        }
    } catch (err) {
        toast.error(err.response?.data?.message || "Invalid credentials");
    } finally {
        setSubmitting(false);
    } 
    },
  });
if (user) {
    return <Navigate to={user.role === "ADMIN" ? "/admin" : "/home"} replace />;
}

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      {/* card */}
      <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border border-gray-100 p-8">

        {/* header */}
        <div className="mb-8">
          <div className="w-10 h-10 bg-gray-900 rounded-xl mb-6" />
          <h1 className="text-2xl font-semibold text-gray-900 tracking-tight">
            Welcome back
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Sign in to your account
          </p>
        </div>



        {/* form */}
        <form onSubmit={formik.handleSubmit} className="flex flex-col gap-4">
          <InputField
            label="Email"
            type="email"
            placeholder="you@example.com"
            {...formik.getFieldProps("email")}
            error={formik.errors.email}
            touched={formik.touched.email}
          />
          <InputField
            label="Password"
            type="password"
            placeholder="••••••••"
            {...formik.getFieldProps("password")}
            error={formik.errors.password}
            touched={formik.touched.password}
          />

          <button
            type="submit"
            disabled={formik.isSubmitting}
            className="w-full py-3 bg-gray-900 text-white text-sm font-medium
              rounded-xl hover:bg-gray-800 transition-all duration-200 mt-2
              disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {formik.isSubmitting ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              "Sign in"
            )}
          </button>
        </form>

        {/* footer */}
        <p className="text-center text-sm text-gray-500 mt-6">
          Don't have an account?{" "}
          <Link to="/signup" className="text-gray-900 font-medium hover:underline">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Login;