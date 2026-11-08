using FluentValidation;
using Qtkd.Modules.Contracts.DTOs;

namespace Qtkd.Modules.Contracts.Validators;

public class CreateContractValidator : AbstractValidator<CreateContractRequest>
{
    public CreateContractValidator()
    {
        RuleFor(x => x.CustomerId)
            .NotEmpty().WithMessage("Mã định danh khách hàng (CustomerId) không được để trống.");

        RuleFor(x => x.Title)
            .NotEmpty().WithMessage("Tiêu đề hợp đồng không được để trống.")
            .MaximumLength(250).WithMessage("Tiêu đề hợp đồng không được vượt quá 250 ký tự.");

        RuleFor(x => x.EffectiveFrom)
            .NotEmpty().WithMessage("Ngày bắt đầu hiệu lực không được để trống.");

        RuleFor(x => x.EffectiveTo)
            .NotEmpty().WithMessage("Ngày kết thúc hiệu lực không được để trống.")
            .Must((req, to) => to > req.EffectiveFrom)
            .WithMessage("Ngày kết thúc hiệu lực (EffectiveTo) phải lớn hơn ngày bắt đầu hiệu lực (EffectiveFrom).")
            .When(x => x.EffectiveFrom != default && x.EffectiveTo != default);

        RuleFor(x => x.ContractValue)
            .GreaterThanOrEqualTo(0).WithMessage("Giá trị hợp đồng phải lớn hơn hoặc bằng 0.");

        RuleFor(x => x.Currency)
            .NotEmpty().WithMessage("Đơn vị tiền tệ không được để trống.")
            .MaximumLength(10).WithMessage("Đơn vị tiền tệ không được vượt quá 10 ký tự.");

        RuleFor(x => x.Code)
            .MaximumLength(30).WithMessage("Mã hợp đồng không được vượt quá 30 ký tự.")
            .When(x => !string.IsNullOrWhiteSpace(x.Code));

        RuleFor(x => x.PaymentTerms)
            .MaximumLength(1000).WithMessage("Điều khoản thanh toán không được vượt quá 1000 ký tự.")
            .When(x => !string.IsNullOrWhiteSpace(x.PaymentTerms));

        RuleFor(x => x.ServiceTerms)
            .MaximumLength(2000).WithMessage("Điều khoản dịch vụ không được vượt quá 2000 ký tự.")
            .When(x => !string.IsNullOrWhiteSpace(x.ServiceTerms));
    }
}