import { useFormik } from "formik";
import * as Yup from "yup";
import { Link, useNavigate, Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import InputField from "../components/InputField";
import toast from "react-hot-toast";

const validationSchema = Yup.object({
  name: Yup.string().min(2).required("Name is required"),
  email: Yup.string().email().required("Email is required"),
  password: Yup.string().min(8).required("Password is required"),
  phoneNumber: Yup.string().required("Phone number is required"),
});

const Signup = () => {
  const { signup, user } = useAuth();
  const navigate = useNavigate();

  const formik = useFormik({
    initialValues: { name: "", email: "", password: "", phoneNumber: "" },
    validationSchema,
    onSubmit: async (values, { setSubmitting }) => {
      try {
        await signup(values.name, values.email, values.password, values.phoneNumber);
        toast.success("Account created!");
        navigate("/login");
      } catch (err) {
        toast.error(err.response?.data?.message || "Error");
      } finally {
        setSubmitting(false);
      }
    },
  });

  if (user) return <Navigate to="/home" replace />;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-100 via-white to-indigo-100 p-4">

      <div className="w-full max-w-md p-[1px] rounded-3xl bg-gradient-to-r from-purple-300 via-indigo-300 to-blue-300">
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-8 border border-white/40 shadow-xl">

          {/* header */}
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-bold text-gray-900">Create Account</h1>
            <p className="text-sm text-gray-600 mt-2">
              Start your lab experience now
            </p>
          </div>

          {/* form */}
          <form onSubmit={formik.handleSubmit} className="space-y-4">

            <InputField label="Full name" {...formik.getFieldProps("name")} error={formik.errors.name} touched={formik.touched.name} />
            <InputField label="Email" {...formik.getFieldProps("email")} error={formik.errors.email} touched={formik.touched.email} />
            <InputField type="password" label="Password" {...formik.getFieldProps("password")} error={formik.errors.password} touched={formik.touched.password} />
            <InputField label="Phone number" {...formik.getFieldProps("phoneNumber")} error={formik.errors.phoneNumber} touched={formik.touched.phoneNumber} />

            <button
              type="submit"
              disabled={formik.isSubmitting}
              className="w-full py-3 rounded-xl text-white font-medium
                         bg-gradient-to-r from-purple-600 to-indigo-600
                         hover:from-purple-700 hover:to-indigo-700
                         transition-all duration-200 shadow-md"
            >
              {formik.isSubmitting ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto" />
              ) : (
                "Create account"
              )}
            </button>
          </form>

          {/* footer */}
          <p className="text-center text-sm text-gray-600 mt-6">
            Already have an account?{" "}
            <Link
              to="/login"
              className="text-indigo-600 font-semibold hover:underline"
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>

    </div>
  );
};

export default Signup;