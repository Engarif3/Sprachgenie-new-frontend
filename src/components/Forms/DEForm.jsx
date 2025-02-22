import { FormProvider, useForm } from "react-hook-form";

const DEForm = ({ children, onSubmit, resolver, defaultValues }) => {
  const fromConfig = {};
  if (resolver) {
    fromConfig["resolver"] = resolver;
  }
  if (defaultValues) {
    fromConfig["defaultValues"] = defaultValues;
  }
  const methods = useForm(fromConfig);
  const submit = (data) => {
    console.log(data);
    onSubmit(data);
  };
  return (
    <FormProvider {...methods}>
      <form onSubmit={methods.handleSubmit(submit)}>{children}</form>
    </FormProvider>
  );
};

export default DEForm;
