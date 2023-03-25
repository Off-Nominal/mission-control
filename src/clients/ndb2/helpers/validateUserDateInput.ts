export const validateUserDateInput = (date: string): boolean => {
  const isDueDateValid = date.match(
    /^\d{4}[\/\-\.](0?[1-9]|1[012])[\/\-\.](0?[1-9]|[12][0-9]|3[01])$/g
  );
  return !!isDueDateValid;
};
