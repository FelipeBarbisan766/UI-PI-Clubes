export interface SignUpPayload {
  name: string;
  email: string;
  password: string;
}
export interface CompleteProfilePayload {
  phoneNumber: string;
  cpf: string;
  birthDate: string; 
}