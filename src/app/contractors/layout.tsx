import { ContractorShell } from './contractor-shell';

export default function ContractorLayout({ children }: { children: React.ReactNode }) {
  return <ContractorShell>{children}</ContractorShell>;
}
