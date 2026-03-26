import { useFormik } from "formik";
import * as Yup from "yup";
import { Link, useNavigate , Navigate  } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import InputField from "../components/InputField";
import toast from "react-hot-toast";

const validationSchema = Yup.object({
  name: Yup.string().min(2, "Too short").required("Name is required"),
  email: Yup.string().email("Invalid email").required("Email is required"),
  password: Yup.string()
    .min(8, "Minimum 8 characters")
    .required("Password is required"),
  phoneNumber: Yup.string()
    .matches(/^\+?[0-9]{10,15}$/, "Invalid phone number")
    .required("Phone number is required"),
});

const Signup = () => {
  const { signup , user } = useAuth();
  const navigate = useNavigate();


  const formik = useFormik({
    initialValues: { name: "", email: "", password: "", phoneNumber: "" },
    validationSchema,
    onSubmit: async (values, { setSubmitting }) => {
      try {
        await signup(values.name, values.email, values.password, values.phoneNumber);
        toast.success("Account created! Please sign in.");
        navigate("/login");
      } catch (err) {
        toast.error(err.response?.data?.message || "Something went wrong");
      } finally {
        setSubmitting(false);
      }
    },
  });
    if (user) {
    return <Navigate to="/home" replace />;
  }
  
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border border-gray-100 p-8">

        {/* header */}
        <div className="mb-8">
          <div className="w-10 h-10 bg-gray-900 rounded-xl mb-6" />
          <h1 className="text-2xl font-semibold text-gray-900 tracking-tight">
            Create account
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Get started for free
          </p>
        </div>

        {/* form */}
        <form onSubmit={formik.handleSubmit} className="flex flex-col gap-4">
          <InputField
            label="Full name"
            type="text"
            placeholder="John Doe"
            {...formik.getFieldProps("name")}
            error={formik.errors.name}
            touched={formik.touched.name}
          />
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
            placeholder="Min 8 characters"
            {...formik.getFieldProps("password")}
            error={formik.errors.password}
            touched={formik.touched.password}
          />
          <InputField
            label="Phone number"
            type="text"
            placeholder="+1234567890"
            {...formik.getFieldProps("phoneNumber")}
            error={formik.errors.phoneNumber}
            touched={formik.touched.phoneNumber}
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
              "Create account"
            )}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-6">
          Already have an account?{" "}
          <Link to="/login" className="text-gray-900 font-medium hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Signup;