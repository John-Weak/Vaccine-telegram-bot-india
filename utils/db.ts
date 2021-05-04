//SCHEMA
type Idata = {
  user?: string;
  firstName?: string;
  lastname?: string;
  chatId: number;
  pincode: string;
  age: string;
};

type IFound = {
  name: string;
  address: string;
  date: string;
  slots: string;
  vaccine: string;
  available_capacity: number;
  fee: string;
};

type Schema = {
  data: Idata[];
  found: IFound[];
};
