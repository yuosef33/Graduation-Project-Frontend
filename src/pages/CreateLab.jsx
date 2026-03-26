import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useFormik } from "formik";
import * as Yup from "yup";
import api from "../api/axios";
import toast from "react-hot-toast";
import InputField from "../components/InputField";

const validationSchema = Yup.object({
  labName: Yup.string().required("Lab name is required"),
  labDescription: Yup.string().required("Description is required"),
  labInstructions: Yup.string().required("Instructions are required"),
  labDuration: Yup.number()
    .min(1, "Minimum 1 minute")
    .required("Duration is required"),
  labStartTime: Yup.string().required("Start time is required"),
  labTemplateId: Yup.number().required("Please select a template"),
});

const CreateLab = () => {
  const navigate = useNavigate();
  const [templates, setTemplates] = useState([]);
  const [loadingTemplates, setLoadingTemplates] = useState(true);

  // fetch available templates
  useEffect(() => {
    api.get("/lab/GetAllAmi")
      .then((res) => {
        // show only AVAILABLE templates
        const available = res.data.filter(
          (t) => t.labTemplateStatus === "AVAILABLE"
        );
        setTemplates(available);
      })
      .catch(() => toast.error("Failed to load templates"))
      .finally(() => setLoadingTemplates(false));
  }, []);

  const formik = useFormik({
    initialValues: {
      labName: "",
      labDescription: "",
      labInstructions: "",
      labDuration: "",
      labStartTime: "",
      labTemplateId: "",
    },
    validationSchema,
    onSubmit: async (values, { setSubmitting }) => {
      try {
        await api.post("/lab/create-lab", {
          labName: values.labName,
          labDescription: values.labDescription,
          labInstructions: values.labInstructions,
          labDuration: parseInt(values.labDuration),
          labStartTime: values.labStartTime,
          labTemplateId: parseInt(values.labTemplateId),
        });
        toast.success("Lab created successfully!");
        navigate("/admin");
      } catch (err) {
        toast.error(err.response?.data?.message || "Failed to create lab");
      } finally {
        setSubmitting(false);
      }
    },
  });

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-lg mx-auto">

        {/* header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">Create Lab</h1>
            <p className="text-sm text-gray-500 mt-0.5">Set up a new lab exam</p>
          </div>
          <button
            onClick={() => navigate("/admin")}
            className="text-sm text-gray-500 hover:text-gray-900 transition-colors"
          >
            ← Back
          </button>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <form onSubmit={formik.handleSubmit} className="flex flex-col gap-4">

            <InputField
              label="Lab Name"
              type="text"
              placeholder="e.g. Python Programming Exam"
              {...formik.getFieldProps("labName")}
              error={formik.errors.labName}
              touched={formik.touched.labName}
            />

            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-600 tracking-wide">
                Description
              </label>
              <textarea
                placeholder="Describe the lab..."
                rows={3}
                className={`w-full px-4 py-3 rounded-xl border bg-gray-50 text-gray-900
                  placeholder:text-gray-400 text-sm outline-none transition-all duration-200
                  focus:bg-white focus:border-gray-900 focus:ring-2 focus:ring-gray-900/10
                  ${formik.touched.labDescription && formik.errors.labDescription
                    ? "border-red-400 bg-red-50" : "border-gray-200"}`}
                {...formik.getFieldProps("labDescription")}
              />
              {formik.touched.labDescription && formik.errors.labDescription && (
                <p className="text-xs text-red-500">{formik.errors.labDescription}</p>
              )}
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-600 tracking-wide">
                Instructions
              </label>
              <textarea
                placeholder="Step by step instructions for students..."
                rows={4}
                className={`w-full px-4 py-3 rounded-xl border bg-gray-50 text-gray-900
                  placeholder:text-gray-400 text-sm outline-none transition-all duration-200
                  focus:bg-white focus:border-gray-900 focus:ring-2 focus:ring-gray-900/10
                  ${formik.touched.labInstructions && formik.errors.labInstructions
                    ? "border-red-400 bg-red-50" : "border-gray-200"}`}
                {...formik.getFieldProps("labInstructions")}
              />
              {formik.touched.labInstructions && formik.errors.labInstructions && (
                <p className="text-xs text-red-500">{formik.errors.labInstructions}</p>
              )}
            </div>

            <InputField
              label="Duration (minutes)"
              type="number"
              placeholder="e.g. 120"
              {...formik.getFieldProps("labDuration")}
              error={formik.errors.labDuration}
              touched={formik.touched.labDuration}
            />

            <InputField
              label="Start Time"
              type="datetime-local"
              {...formik.getFieldProps("labStartTime")}
              error={formik.errors.labStartTime}
              touched={formik.touched.labStartTime}
            />

            {/* template selector */}
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-600 tracking-wide">
                Lab Template
              </label>
              {loadingTemplates ? (
                <div className="flex items-center gap-2 py-3">
                  <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                  <span className="text-sm text-gray-400">Loading templates...</span>
                </div>
              ) : templates.length === 0 ? (
                <div className="px-4 py-3 rounded-xl border border-orange-200 bg-orange-50">
                  <p className="text-sm text-orange-600">
                    No available templates. Create a lab template first.
                  </p>
                </div>
              ) : (
                <select
                  className={`w-full px-4 py-3 rounded-xl border bg-gray-50 text-gray-900
                    text-sm outline-none transition-all duration-200
                    focus:bg-white focus:border-gray-900
                    ${formik.touched.labTemplateId && formik.errors.labTemplateId
                      ? "border-red-400" : "border-gray-200"}`}
                  {...formik.getFieldProps("labTemplateId")}
                >
                  <option value="">Select a template</option>
                  {templates.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.amiName}
                    </option>
                  ))}
                </select>
              )}
              {formik.touched.labTemplateId && formik.errors.labTemplateId && (
                <p className="text-xs text-red-500">{formik.errors.labTemplateId}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={formik.isSubmitting || templates.length === 0}
              className="w-full py-3 bg-gray-900 text-white text-sm font-medium
                rounded-xl hover:bg-gray-800 transition-all duration-200 mt-2
                disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {formik.isSubmitting ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : "Create Lab"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreateLab;