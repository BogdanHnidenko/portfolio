import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { useSettings } from '../../store/settings';
import { Photo } from './Photo';

beforeEach(() => {
  act(() => {
    useSettings.setState({ theme: 'dark', lang: 'en' });
  });
});

describe('Photo', () => {
  it('поки фото вантажиться, показує заглушку без підпису, а <img> прихований і без alt', () => {
    // Контейнер рендеру: перший дочірній елемент — рамка фото
    const { container } = render(<Photo variant="home" />);
    expect(screen.getByTestId('photo-placeholder')).toBeInTheDocument();
    expect(container.firstElementChild).toHaveAttribute('role', 'img');
    expect(container.firstElementChild).toHaveAttribute('aria-label', 'Photo placeholder');
    // Зображення ще не завантажене
    const img = screen.getByTestId('photo-img');
    expect(img).toHaveAttribute('src', '/photo.jpg');
    expect(img).toHaveAttribute('alt', '');
    expect(container).not.toHaveTextContent(/your photo|твоє фото|4:5|3:4/i);
  });

  it('без файлу (onError) прибирає <img> і лишає заглушку', () => {
    render(<Photo variant="about" />);
    fireEvent.error(screen.getByTestId('photo-img'));
    expect(screen.queryByTestId('photo-img')).not.toBeInTheDocument();
    expect(screen.getByTestId('photo-placeholder')).toBeInTheDocument();
  });

  it('коли фото завантажилось, показує <img> з alt = імʼя і прибирає заглушку', () => {
    // Контейнер рендеру: перший дочірній елемент — рамка аватара
    const { container } = render(<Photo variant="avatar" />);
    fireEvent.load(screen.getByTestId('photo-img'));
    expect(screen.getByTestId('photo-img')).toHaveAttribute('alt', 'Bohdan Hnidenko');
    expect(screen.queryByTestId('photo-placeholder')).not.toBeInTheDocument();
    expect(container.firstElementChild).not.toHaveAttribute('role');
  });

  it('alt фото перекладається разом із мовою', () => {
    render(<Photo variant="home" />);
    fireEvent.load(screen.getByTestId('photo-img'));
    act(() => {
      useSettings.setState({ lang: 'ua' });
    });
    expect(screen.getByTestId('photo-img')).toHaveAttribute('alt', 'Богдан Гніденко');
  });

  it('вміст поверх фото (бейдж) видно і з заглушкою, і з фото', () => {
    // Контейнер рендеру з бейджем усередині фото
    const { container } = render(
      <Photo variant="home">
        <div data-testid="photo-badge">badge</div>
      </Photo>,
    );
    expect(within(container).getByTestId('photo-badge')).toBeInTheDocument();
    fireEvent.load(screen.getByTestId('photo-img'));
    expect(within(container).getByTestId('photo-badge')).toBeInTheDocument();
  });
});
