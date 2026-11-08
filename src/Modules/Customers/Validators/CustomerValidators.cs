using System.Text.RegularExpressions;
using FluentValidation;
using Qtkd.Modules.Customers.DTOs;

namespace Qtkd.Modules.Customers.Validators;

public static class CustomerValidationRules
{
    public const string TaxCodeRegex = @"^[0-9]{10}(-[0-9]{3})?$";
    public const string CustomerCodeRegex = @"^[A-Za-z0-9_-]{3,20}$";
    public const string PhoneNumberRegex = @"^[0-9+() -]{8,20}$";

    public static bool IsValidTaxCode(string? taxCode)
    {
        if (string.IsNullOrWhiteSpace(taxCode)) return false;
        return Regex.IsMatch(taxCode.Trim(), TaxCodeRegex);
    }

    public static bool IsValidCustomerCode(string? code)
    {
        if (string.IsNullOrWhiteSpace(code)) return false;
        return Regex.IsMatch(code.Trim(), CustomerCodeRegex);
    }

    public static bool IsValidPhoneNumber(string? phone)
    {
        if (string.IsNullOrWhiteSpace(phone)) return true; // Phone là trường tùy chọn
        return Regex.IsMatch(phone.Trim(), PhoneNumberRegex);
    }
}

/// <summary>
/// Validator cho yêu cầu tạo mới khách hàng (TASK-22, TASK-24)
/// </summary>
public class CreateCustomerValidator : AbstractValidator<CreateCustomerRequest>
{
    public CreateCustomerValidator()
    {
        RuleFor(x => x.Code)
            .NotEmpty().WithMessage("Mã khách hàng không được để trống.")
            .Must(CustomerValidationRules.IsValidCustomerCode)
            .WithMessage("Mã khách hàng chỉ được chứa từ 3 đến 20 ký tự chữ cái, số, gạch ngang (-) hoặc gạch dưới (_).");

        RuleFor(x => x.Name)
            .NotEmpty().WithMessage("Tên khách hàng không được để trống.")
            .MaximumLength(200).WithMessage("Tên khách hàng không được vượt quá 200 ký tự.");

        RuleFor(x => x.TaxCode)
            .NotEmpty().WithMessage("Mã số thuế không được để trống.")
            .Must(CustomerValidationRules.IsValidTaxCode)
            .WithMessage("Mã số thuế không đúng định dạng (gồm 10 chữ số hoặc 13 chữ số có dấu gạch ngang, ví dụ: 0101234567 hoặc 0101234567-001).");

        RuleFor(x => x.Address)
            .NotEmpty().WithMessage("Địa chỉ trụ sở khách hàng không được để trống.")
            .MaximumLength(500).WithMessage("Địa chỉ không được vượt quá 500 ký tự.");

        RuleFor(x => x.RepresentativeName)
            .NotEmpty().WithMessage("Tên người đại diện pháp luật không được để trống.")
            .MaximumLength(150).WithMessage("Tên người đại diện không được vượt quá 150 ký tự.");

        RuleFor(x => x.RepresentativeTitle)
            .MaximumLength(100).WithMessage("Chức danh người đại diện không được vượt quá 100 ký tự.")
            .When(x => !string.IsNullOrWhiteSpace(x.RepresentativeTitle));

        RuleFor(x => x.ContactPerson)
            .MaximumLength(150).WithMessage("Tên người liên hệ không được vượt quá 150 ký tự.")
            .When(x => !string.IsNullOrWhiteSpace(x.ContactPerson));

        RuleFor(x => x.ContactPhone)
            .MaximumLength(20).WithMessage("Số điện thoại liên hệ không được vượt quá 20 ký tự.")
            .Must(CustomerValidationRules.IsValidPhoneNumber)
            .WithMessage("Số điện thoại liên hệ không đúng định dạng.")
            .When(x => !string.IsNullOrWhiteSpace(x.ContactPhone));

        RuleFor(x => x.ContactEmail)
            .MaximumLength(150).WithMessage("Email liên hệ không được vượt quá 150 ký tự.")
            .EmailAddress().WithMessage("Email liên hệ không đúng định dạng email hợp lệ.")
            .When(x => !string.IsNullOrWhiteSpace(x.ContactEmail));
    }
}

/// <summary>
/// Validator cho yêu cầu cập nhật thông tin khách hàng (TASK-22, TASK-24)
/// </summary>
public class UpdateCustomerValidator : AbstractValidator<UpdateCustomerRequest>
{
    public UpdateCustomerValidator()
    {
        RuleFor(x => x.Name)
            .NotEmpty().WithMessage("Tên khách hàng không được để trống.")
            .MaximumLength(200).WithMessage("Tên khách hàng không được vượt quá 200 ký tự.");

        RuleFor(x => x.TaxCode)
            .NotEmpty().WithMessage("Mã số thuế không được để trống.")
            .Must(CustomerValidationRules.IsValidTaxCode)
            .WithMessage("Mã số thuế không đúng định dạng (gồm 10 chữ số hoặc 13 chữ số có dấu gạch ngang, ví dụ: 0101234567 hoặc 0101234567-001).");

        RuleFor(x => x.Address)
            .NotEmpty().WithMessage("Địa chỉ trụ sở khách hàng không được để trống.")
            .MaximumLength(500).WithMessage("Địa chỉ không được vượt quá 500 ký tự.");

        RuleFor(x => x.RepresentativeName)
            .NotEmpty().WithMessage("Tên người đại diện pháp luật không được để trống.")
            .MaximumLength(150).WithMessage("Tên người đại diện không được vượt quá 150 ký tự.");

        RuleFor(x => x.RepresentativeTitle)
            .MaximumLength(100).WithMessage("Chức danh người đại diện không được vượt quá 100 ký tự.")
            .When(x => !string.IsNullOrWhiteSpace(x.RepresentativeTitle));

        RuleFor(x => x.ContactPerson)
            .MaximumLength(150).WithMessage("Tên người liên hệ không được vượt quá 150 ký tự.")
            .When(x => !string.IsNullOrWhiteSpace(x.ContactPerson));

        RuleFor(x => x.ContactPhone)
            .MaximumLength(20).WithMessage("Số điện thoại liên hệ không được vượt quá 20 ký tự.")
            .Must(CustomerValidationRules.IsValidPhoneNumber)
            .WithMessage("Số điện thoại liên hệ không đúng định dạng.")
            .When(x => !string.IsNullOrWhiteSpace(x.ContactPhone));

        RuleFor(x => x.ContactEmail)
            .MaximumLength(150).WithMessage("Email liên hệ không được vượt quá 150 ký tự.")
            .EmailAddress().WithMessage("Email liên hệ không đúng định dạng email hợp lệ.")
            .When(x => !string.IsNullOrWhiteSpace(x.ContactEmail));
    }
}

/// <summary>
/// Validator cho yêu cầu chuyển đổi trạng thái khách hàng (TASK-25)
/// </summary>
public class UpdateCustomerStatusValidator : AbstractValidator<UpdateCustomerStatusRequest>
{
    public UpdateCustomerStatusValidator()
    {
        RuleFor(x => x.Status)
            .IsInEnum().WithMessage("Trạng thái khách hàng không hợp lệ (chỉ chấp nhận Active hoặc Suspended).");

        RuleFor(x => x.Reason)
            .MaximumLength(500).WithMessage("Lý do tạm ngưng không được vượt quá 500 ký tự.")
            .When(x => !string.IsNullOrWhiteSpace(x.Reason));
    }
}

/// <summary>
/// Validator cho yêu cầu truy vấn danh sách khách hàng (TASK-25)
/// </summary>
public class GetCustomersQueryValidator : AbstractValidator<GetCustomersQuery>
{
    public GetCustomersQueryValidator()
    {
        RuleFor(x => x.PageIndex)
            .GreaterThanOrEqualTo(1).WithMessage("PageIndex phải lớn hơn hoặc bằng 1.");

        RuleFor(x => x.PageSize)
            .InclusiveBetween(1, 100).WithMessage("PageSize phải nằm trong khoảng từ 1 đến 100.");

        RuleFor(x => x.Status)
            .IsInEnum().When(x => x.Status.HasValue).WithMessage("Trạng thái lọc không hợp lệ.");

        RuleFor(x => x.SearchTerm)
            .MaximumLength(100).WithMessage("Từ khóa tìm kiếm không được vượt quá 100 ký tự.")
            .When(x => !string.IsNullOrWhiteSpace(x.SearchTerm));

        RuleFor(x => x.Keyword)
            .MaximumLength(100).WithMessage("Từ khóa tìm kiếm không được vượt quá 100 ký tự.")
            .When(x => !string.IsNullOrWhiteSpace(x.Keyword));
    }
}