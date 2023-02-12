function IDRupiah() {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
    });
  }