import { useFormik } from "formik";
import * as Yup from "yup";
import { Link, useNavigate, Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import InputField from "../components/InputField";
import toast from "react-hot-toast";

const validationSchema = Yup.object({
  email: Yup.string().email("Invalid email").required("Email is required"),
  password: Yup.string().required("Password is required"),
});

const Login = () => {
  const { login, user } = useAuth();
  const navigate = useNavigate();

  const formik = useFormik({
    initialValues: { email: "", password: "" },
    validationSchema,
    onSubmit: async (values, { setSubmitting }) => {
      try {
        const res = await login(values.email, values.password);
        toast.success("Welcome back!");
        navigate(res.role === "ADMIN" ? "/admin" : "/home");
      } catch (err) {
      console.log("LOGIN ERROR:", err);

      const message =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        err?.message ||
        "Invalid email or password";

      toast.error(message);
      } finally {
        setSubmitting(false);
      }
    },
  });

  if (user) {
    return <Navigate to={user.role === "ADMIN" ? "/admin" : "/home"} replace />;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-100 via-white to-blue-100 p-4">

      <div className="w-full max-w-md p-[1px] rounded-3xl bg-gradient-to-r from-indigo-300 via-blue-300 to-purple-300">
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-8 border border-white/40 shadow-xl">

          {/* header */}
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-bold text-gray-900">Welcome Back</h1>
            <p className="text-sm text-gray-600 mt-2">
              Sign in to continue your lab journey
            </p>
          </div>

          {/* form */}
          <form onSubmit={formik.handleSubmit} className="space-y-4">

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
              className="w-full py-3 rounded-xl text-white font-medium
                         bg-gradient-to-r from-indigo-600 to-blue-600
                         hover:from-indigo-700 hover:to-blue-700
                         transition-all duration-200 shadow-md"
            >
              {formik.isSubmitting ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto" />
              ) : (
                "Sign in"
              )}
            </button>
          </form>

          {/* footer */}
          <p className="text-center text-sm text-gray-600 mt-6">
            Don’t have an account?{" "}
            <Link
              to="/signup"
              className="text-indigo-600 font-semibold hover:underline"
            >
              Create one
            </Link>
          </p>
        </div>
      </div>

    </div>
  );
};

export default Login;