// service-locator.ts
// ------------------
// This file acts as a centralized access point for all singleton services
// and repositories in the application. It ensures that every part of the
// code (controllers, use-cases, etc.) gets the same instance of each service
// or repository, enforcing singleton behavior and preventing accidental 
// multiple instantiations.

// ------------------
// Services
// ------------------

// AuthenticationService handles user authentication, session management, 
import { AuthenticationService } from '@/src/services/authentication.service';
export function getAuthenticationService() {
  return AuthenticationService.getInstance();
}

// TransactionManagerService wraps database transactions and manages nested transactions.
import { TransactionManagerService } from '@/src/services/transaction-manager.service';
export function getTransactionManagerService() {
  return TransactionManagerService.getInstance();
}

// QRCodeService handles QR code generation for tipping URLs.
import { QRCodeService } from '@/src/services/qr-code.service';
export function getQRCodeService() {
  return QRCodeService.getInstance();
}

// PaymentService handles payment processing (mock implementation - replace with real gateway).
import { PaymentService } from '@/src/services/payment.service';
export function getPaymentService() {
  return PaymentService.getInstance();
}

// ------------------
// Repositories
// ------------------

// UsersRepository provides data access for user entities.
import { UsersRepository } from '@/src/repositories/users.repository';
export function getUsersRepository() {
  return UsersRepository.getInstance();
}

// CompaniesRepository provides data access for company entities.
import { CompaniesRepository } from '@/src/repositories/companies.repository';
export function getCompaniesRepository() {
  return CompaniesRepository.getInstance();
}

// CompanyMembersRepository provides data access for company member relationships.
import { CompanyMembersRepository } from '@/src/repositories/company-members.repository';
export function getCompanyMembersRepository() {
  return CompanyMembersRepository.getInstance();
}

// BranchesRepository provides data access for branch entities.
import { BranchesRepository } from '@/src/repositories/branches.repository';
export function getBranchesRepository() {
  return BranchesRepository.getInstance();
}

// StaffProfilesRepository provides data access for staff profile entities.
import { StaffProfilesRepository } from '@/src/repositories/staff-profiles.repository';
export function getStaffProfilesRepository() {
  return StaffProfilesRepository.getInstance();
}

// TipsRepository provides data access for tip entities.
import { TipsRepository } from '@/src/repositories/tips.repository';
export function getTipsRepository() {
  return TipsRepository.getInstance();
}

// PayoutBatchesRepository provides data access for payout batch entities.
import { PayoutBatchesRepository } from '@/src/repositories/payout-batches.repository';
export function getPayoutBatchesRepository() {
  return PayoutBatchesRepository.getInstance();
}

// PayoutItemsRepository provides data access for payout item entities.
import { PayoutItemsRepository } from '@/src/repositories/payout-items.repository';
export function getPayoutItemsRepository() {
  return PayoutItemsRepository.getInstance();
}


// ------------------
// Usage Flow
// ------------------
// 1. Controllers or use-cases import this service-locator to access the singletons.
//    e.g., const authService = getAuthenticationService();
// 2. Each `getX()` function returns the same instance every time.
// 3. This approach prevents accidental `new Service()` calls anywhere in the app.
// 4. The service-locator acts purely as a convenience layer; the singleton
//    enforcement is implemented inside each service/repository class.
